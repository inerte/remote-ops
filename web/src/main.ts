import {
  loadBootstrap,
  loadHydratedShell,
  runAcknowledgeShell,
  runAdvanceShell,
  runLaunchMission,
  runOpenMissionConfig,
  runQueueOrder,
  runResetShell,
  runReturnToContractLobby,
  runReturnToMissionConfig,
  runSelectContract,
  runSetEntryPlan,
} from './app/bootstrap'
import {
  createOrderDraft,
  buildBrowserOrderCommand,
  orderTypeDescription,
  orderTypeNeedsPosition,
  orderTypeNeedsTargetRobot,
  type BrowserShellOrderType,
} from './app/orders'
import { validateAutosavePayload } from './app/autosave'
import {
  createBoardInspectorModel,
  NO_BOARD_SELECTION,
  normalizeBoardSelection,
  type BoardSelection,
} from './app/boardInspector'
import type { AppBootstrap } from './app/types'
import { createBoard } from './renderer/board'
import './styles/app.css'
import { renderLayout, type SidebarTab } from './ui/layout'

const AUTOSAVE_STORAGE_KEY = 'remote-ops.autosave'

type StatusMessage = {
  readonly state: 'idle' | 'success' | 'error'
  readonly text: string
}

type BoardHandle = Awaited<ReturnType<typeof createBoard>>

const setStatus = (
  statusElement: HTMLParagraphElement,
  text: string,
  state: StatusMessage['state'],
): void => {
  statusElement.textContent = text
  if (state === 'idle') {
    statusElement.removeAttribute('data-state')
    return
  }

  statusElement.dataset.state = state
}

const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : String(error)

const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard === undefined) {
    throw new Error('Clipboard API is unavailable in this browser context.')
  }

  await navigator.clipboard.writeText(text)
}

const readStoredAutosave = (): string | null => {
  try {
    if ('localStorage' in globalThis === false) {
      return null
    }

    return globalThis.localStorage.getItem(AUTOSAVE_STORAGE_KEY)
  } catch {
    return null
  }
}

const persistAutosave = (autosave: string): StatusMessage => {
  try {
    if ('localStorage' in globalThis === false) {
      throw new Error('Local storage is unavailable in this browser context.')
    }

    const storage = globalThis.localStorage
    storage.setItem(AUTOSAVE_STORAGE_KEY, autosave)
    if (storage.getItem(AUTOSAVE_STORAGE_KEY) !== autosave) {
      throw new Error('Autosave write could not be verified.')
    }

    return {
      state: 'success',
      text: `Canonical autosave stored locally as ${AUTOSAVE_STORAGE_KEY}.`,
    }
  } catch (error: unknown) {
    return {
      state: 'error',
      text: formatError(error),
    }
  }
}

const createSaveStatus = (
  autosave: string,
  successText?: string,
): StatusMessage => {
  const persistStatus = persistAutosave(autosave)
  if (successText === undefined || persistStatus.state === 'error') {
    return persistStatus
  }

  return {
    state: 'success',
    text: `${successText} ${persistStatus.text}`,
  }
}

const loadInitialShell = async (): Promise<AppBootstrap> => {
  const storedAutosave = readStoredAutosave()
  if (storedAutosave === null) {
    return loadBootstrap()
  }

  return loadHydratedShell(storedAutosave)
}

const isMissionStage = (shell: AppBootstrap): boolean => shell.shell.activeStage === 'mission'

const createActionTone = (shell: AppBootstrap): StatusMessage['state'] => {
  if (isMissionStage(shell) === false) {
    return 'idle'
  }

  if (shell.debrief.tone === 'success') {
    return 'success'
  }

  if (shell.debrief.tone === 'error') {
    return 'error'
  }

  return 'idle'
}

const createDefaultOrderStatus = (shell: AppBootstrap): StatusMessage => {
  switch (shell.shell.activeStage) {
    case 'lobby':
      return {
        state: 'idle',
        text: 'Select a contract, then open the mission briefing before queueing browser orders.',
      }
    case 'config':
      return {
        state: 'idle',
        text: 'Choose an entry plan and launch the mission before queueing browser orders.',
      }
    case 'mission':
      return {
        state: 'idle',
        text: shell.debrief.isTerminal
          ? `${shell.debrief.outcome}. Replay from briefing or restore a saved run to issue more orders.`
          : shell.controls.canQueueOrders
            ? 'Pick an operator from the board uplink strip, queue a high-level order, then advance the deterministic shell.'
            : 'High-level order entry unlocks once interrupts are cleared and the mission is still active.',
      }
  }
}

const humanizeRejectedOrder = (shell: AppBootstrap, eventMessage: string): string => {
  const match = /^Order rejected: ([^ ]+) -> ([^|]+?)(?: \| (.+))?$/.exec(eventMessage)
  if (match === null) {
    return eventMessage
  }

  const [, robotId, , rawReason] = match
  const robotName = shell.robots.find((candidate) => candidate.id === robotId)?.name ?? robotId
  const reason = rawReason?.trim()

  if (reason === undefined || reason.length === 0) {
    return `${robotName}'s order was rejected.`
  }

  const offMapMoveMatch = /^Move target (-?\d+),(-?\d+) is not part of the mission map\.$/.exec(
    reason,
  )
  if (offMapMoveMatch !== null) {
    const [, x, y] = offMapMoveMatch
    return `${robotName} can't move to ${x},${y} — that coordinate is an empty gap, not a real mission tile. Try clicking a tile on the tactical board instead of typing the move.`
  }

  const blockedMoveMatch = /^Move target (-?\d+),(-?\d+) is not walkable\.$/.exec(reason)
  if (blockedMoveMatch !== null) {
    const [, x, y] = blockedMoveMatch
    return `${robotName} can't move to ${x},${y} — that tile exists, but it is blocked and not walkable.`
  }

  return `${robotName}'s order was rejected: ${reason}`
}

const createQueuedOrderStatus = (shell: AppBootstrap): StatusMessage => {
  const latestEvent = shell.eventLog.at(-1)?.message
  if (latestEvent?.startsWith('Order rejected:')) {
    return {
      state: 'error',
      text: humanizeRejectedOrder(shell, latestEvent),
    }
  }

  if (latestEvent?.startsWith('Operator queued order:')) {
    return {
      state: 'success',
      text: latestEvent,
    }
  }

  return {
    state: 'success',
    text: 'Order request resolved and the canonical autosave was refreshed.',
  }
}

const main = async (): Promise<void> => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app === null) {
    throw new Error('App root #app was not found.')
  }

  let boardApp: BoardHandle | null = null
  let shell = await loadInitialShell()
  let orderDraft = createOrderDraft(shell)
  let boardSelection: BoardSelection = NO_BOARD_SELECTION
  let orderStatus = createDefaultOrderStatus(shell)
  let saveStatus = createSaveStatus(shell.autosave)
  let sidebarTab: SidebarTab = 'mission'

  const render = async (): Promise<void> => {
    boardApp?.destroy()

    boardSelection = isMissionStage(shell) ? normalizeBoardSelection(shell, boardSelection) : NO_BOARD_SELECTION
    orderDraft = createOrderDraft(shell, orderDraft)
    const boardInspector = createBoardInspectorModel(shell, orderDraft, boardSelection)
    const layout = renderLayout(app, shell, orderDraft, boardInspector, sidebarTab)
    boardApp = await createBoard(
      layout.boardHost,
      shell.board,
      shell.robots,
      isMissionStage(shell)
        ? {
            activeRobotId: orderDraft.robotId,
            onSelectRobot: (robot) => {
              boardSelection = { kind: 'robot', robotId: robot.id }
              orderStatus = {
                state: 'idle',
                text: `${robot.name} linked to the board uplink. Use the contextual action panel to issue orders.`,
              }
              void render()
            },
            onSelectTile: (tile) => {
              boardSelection = {
                kind: 'tile',
                position: tile.position,
              }
              orderStatus = {
                state: 'idle',
                text: `${tile.label} selected on the tactical board. Use the contextual action panel to queue a command.`,
              }
              void render()
            },
            selection: boardSelection,
          }
        : undefined,
    )

    setStatus(layout.actionStatus, shell.controls.status, createActionTone(shell))
    setStatus(layout.orderStatus, orderStatus.text, orderStatus.state)
    setStatus(layout.saveStatus, saveStatus.text, saveStatus.state)

    const syncOrderForm = (): void => {
      const orderType = layout.orderTypeField.value as BrowserShellOrderType
      layout.orderFollowField.hidden = orderTypeNeedsTargetRobot(orderType) === false
      layout.orderMoveFields.hidden = orderTypeNeedsPosition(orderType) === false
      layout.orderHint.textContent = orderTypeDescription(orderType)
      layout.orderSubmitButton.disabled = shell.controls.canQueueOrders === false
    }

    const refreshDraftFromLayout = (): void => {
      orderDraft = createOrderDraft(shell, {
        ...orderDraft,
        moveX: layout.orderMoveXField.value,
        moveY: layout.orderMoveYField.value,
        orderType: layout.orderTypeField.value as BrowserShellOrderType,
        targetRobotId: layout.orderTargetField.value,
      })
    }

    const setActiveOperator = (robotId: string, statusText?: string): void => {
      const robot = shell.robots.find((candidate) => candidate.id === robotId)
      if (robot === undefined) {
        throw new Error(`Unknown board operator requested: ${robotId}`)
      }

      orderDraft = createOrderDraft(shell, {
        ...orderDraft,
        robotId,
      })
      boardSelection = { kind: 'robot', robotId }
      orderStatus = {
        state: 'success',
        text: statusText ?? `${robot.name} is now the active board operator.`,
      }
      void render()
    }

    const queueDraftOrder = async (
      nextDraft: ReturnType<typeof createOrderDraft>,
      busyText: string,
    ): Promise<void> => {
      setStatus(layout.orderStatus, busyText, 'idle')

      try {
        shell = await runQueueOrder(shell.autosave, buildBrowserOrderCommand(nextDraft))
        orderDraft = createOrderDraft(shell, nextDraft)
        orderStatus = createQueuedOrderStatus(shell)
        saveStatus = createSaveStatus(shell.autosave)
        await render()
      } catch (error: unknown) {
        orderStatus = {
          state: 'error',
          text: formatError(error),
        }
        setStatus(layout.orderStatus, orderStatus.text, orderStatus.state)
      }
    }

    const runWorldAction = async (
      operation: () => Promise<AppBootstrap>,
      busyText: string,
    ): Promise<void> => {
      setStatus(layout.actionStatus, busyText, 'idle')

      try {
        shell = await operation()
        orderDraft = createOrderDraft(shell, orderDraft)
        orderStatus = createDefaultOrderStatus(shell)
        saveStatus = createSaveStatus(shell.autosave)
        await render()
      } catch (error: unknown) {
        setStatus(layout.actionStatus, formatError(error), 'error')
      }
    }

    for (const button of layout.contractButtons) {
      button.addEventListener('click', () => {
        const contractId = button.dataset.contractId
        if (contractId === undefined) {
          throw new Error('Contract option is missing its data-contract-id attribute.')
        }

        void runWorldAction(
          () => runSelectContract(shell.autosave, contractId),
          'Selecting contract package…',
        )
      })
    }

    layout.openConfigButton.addEventListener('click', () => {
      void runWorldAction(
        () => runOpenMissionConfig(shell.autosave),
        'Opening mission briefing…',
      )
    })

    for (const button of layout.configButtons) {
      button.addEventListener('click', () => {
        const entryPlanId = button.dataset.configId
        if (entryPlanId === undefined) {
          throw new Error('Mission config option is missing its data-config-id attribute.')
        }

        void runWorldAction(
          () => runSetEntryPlan(shell.autosave, entryPlanId),
          'Updating mission briefing…',
        )
      })
    }

    layout.launchMissionButton.addEventListener('click', () => {
      void runWorldAction(
        () => runLaunchMission(shell.autosave),
        'Launching deterministic mission shell…',
      )
    })

    layout.returnToConfigButton.addEventListener('click', () => {
      void runWorldAction(
        () => runReturnToMissionConfig(shell.autosave),
        'Returning to mission briefing…',
      )
    })

    layout.returnToLobbyButton.addEventListener('click', () => {
      void runWorldAction(
        () => runReturnToContractLobby(shell.autosave),
        'Returning to contract lobby…',
      )
    })

    layout.advanceButton.addEventListener('click', () => {
      void runWorldAction(
        () => runAdvanceShell(shell.autosave),
        'Advancing deterministic simulation…',
      )
    })

    layout.acknowledgeButton.addEventListener('click', () => {
      void runWorldAction(
        () => runAcknowledgeShell(shell.autosave),
        'Clearing interrupt queue…',
      )
    })

    layout.resetButton.addEventListener('click', () => {
      void runWorldAction(
        () => runResetShell(),
        'Resetting shell to the default contract lobby…',
      )
    })

    layout.autosaveButton.addEventListener('click', () => {
      void copyText(shell.autosave)
        .then(() => {
          setStatus(
            layout.packetStatus,
            'Current autosave payload copied to the clipboard.',
            'success',
          )
        })
        .catch((error: unknown) => {
          setStatus(layout.packetStatus, formatError(error), 'error')
        })
    })

    layout.restoreAutosaveButton.addEventListener('click', () => {
      void (async () => {
        const autosave = layout.autosaveField.value.trim()
        if (autosave.length === 0) {
          setStatus(
            layout.saveStatus,
            'Paste a canonical autosave payload before restoring the shell.',
            'error',
          )
          return
        }

        setStatus(layout.saveStatus, 'Restoring pasted autosave payload…', 'idle')

        try {
          await validateAutosavePayload(autosave)
          shell = await loadHydratedShell(autosave)
          orderDraft = createOrderDraft(shell, orderDraft)
          orderStatus = createDefaultOrderStatus(shell)
          saveStatus = createSaveStatus(
            shell.autosave,
            'Autosave payload restored into the deterministic shell.',
          )
          await render()
        } catch (error: unknown) {
          setStatus(
            layout.saveStatus,
            `Unable to restore autosave payload: ${formatError(error)}`,
            'error',
          )
        }
      })()
    })

    for (const button of layout.sidebarTabButtons) {
      button.addEventListener('click', () => {
        const nextTab = button.dataset.sidebarTab as SidebarTab | undefined
        if (nextTab === undefined) {
          throw new Error('Sidebar tab is missing its data-sidebar-tab attribute.')
        }

        if (nextTab === sidebarTab) {
          return
        }

        sidebarTab = nextTab
        void render()
      })
    }

    for (const button of layout.operatorButtons) {
      button.addEventListener('click', () => {
        const robotId = button.dataset.operatorRobot
        if (robotId === undefined) {
          throw new Error('Operator switch is missing its data-operator-robot attribute.')
        }

        if (robotId === orderDraft.robotId) {
          return
        }

        const robot = shell.robots.find((candidate) => candidate.id === robotId)
        if (robot === undefined) {
          throw new Error(`Unknown board operator requested: ${robotId}`)
        }

        setActiveOperator(robotId, `${robot.name} linked to the board uplink and manual order queue.`)
      })
    }

    layout.orderTypeField.addEventListener('change', () => {
      refreshDraftFromLayout()
      layout.orderTargetField.value = orderDraft.targetRobotId
      syncOrderForm()
    })

    layout.orderTargetField.addEventListener('change', () => {
      refreshDraftFromLayout()
    })

    layout.orderMoveXField.addEventListener('input', () => {
      refreshDraftFromLayout()
    })

    layout.orderMoveYField.addEventListener('input', () => {
      refreshDraftFromLayout()
    })

    layout.orderForm.addEventListener('submit', (event) => {
      event.preventDefault()

      void (async () => {
        refreshDraftFromLayout()
        await queueDraftOrder(orderDraft, 'Queueing deterministic robot order…')
      })()
    })

    for (const button of layout.boardActionButtons) {
      button.addEventListener('click', () => {
        const actionKind = button.dataset.boardActionKind
        if (actionKind === undefined) {
          throw new Error('Board action is missing its data-board-action-kind attribute.')
        }

        if (actionKind === 'set-operator') {
          const robotId = button.dataset.boardRobotId
          if (robotId === undefined) {
            throw new Error('Board operator action is missing its data-board-robot-id attribute.')
          }

          setActiveOperator(robotId)
          return
        }

        if (actionKind !== 'queue-order') {
          throw new Error(`Unknown board action requested: ${actionKind}`)
        }

        const orderType = button.dataset.boardOrderType as BrowserShellOrderType | undefined
        if (orderType === undefined) {
          throw new Error('Board queue action is missing its data-board-order-type attribute.')
        }

        const nextDraft = createOrderDraft(shell, {
          ...orderDraft,
          moveX: button.dataset.boardMoveX ?? orderDraft.moveX,
          moveY: button.dataset.boardMoveY ?? orderDraft.moveY,
          orderType,
          robotId: button.dataset.boardRobotId ?? orderDraft.robotId,
          targetRobotId: button.dataset.boardTargetRobotId ?? orderDraft.targetRobotId,
        })

        const label = button.textContent?.trim() ?? 'board action'
        void queueDraftOrder(nextDraft, `Queueing ${label.toLowerCase()}…`)
      })
    }

    for (const button of layout.packetButtons) {
      button.addEventListener('click', () => {
        const packetId = button.dataset.packetId
        if (packetId === undefined) {
          throw new Error('Packet button is missing its data-packet-id attribute.')
        }

        const packet = shell.packets.find((candidate) => candidate.id === packetId)
        if (packet === undefined) {
          throw new Error(`Unknown packet requested: ${packetId}`)
        }

        void copyText(packet.body)
          .then(() => {
            setStatus(layout.packetStatus, `${packet.label} copied to the clipboard.`, 'success')
          })
          .catch((error: unknown) => {
            setStatus(layout.packetStatus, formatError(error), 'error')
          })
      })
    }

    syncOrderForm()
  }

  await render()
}

void main()
