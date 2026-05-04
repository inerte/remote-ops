import {
  loadBootstrap,
  loadHydratedShell,
  runAcknowledgeShell,
  runAdvanceShell,
  runQueueOrder,
  runResetShell,
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
import type { AppBootstrap } from './app/types'
import { createBoard } from './renderer/board'
import './styles/app.css'
import { renderLayout } from './ui/layout'

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

const createDefaultOrderStatus = (shell: AppBootstrap): StatusMessage => ({
  state: 'idle',
  text: shell.controls.canQueueOrders
    ? 'Choose a robot, queue a high-level order, then advance the deterministic shell.'
    : 'High-level order entry unlocks once interrupts are cleared and the mission is still active.',
})

const createQueuedOrderStatus = (shell: AppBootstrap): StatusMessage => {
  const latestEvent = shell.eventLog.at(-1)?.message
  if (latestEvent?.startsWith('Order rejected:')) {
    return {
      state: 'error',
      text: latestEvent,
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
  let orderStatus = createDefaultOrderStatus(shell)
  let saveStatus = createSaveStatus(shell.autosave)

  const render = async (): Promise<void> => {
    boardApp?.destroy()

    orderDraft = createOrderDraft(shell, orderDraft)
    const layout = renderLayout(app, shell, orderDraft)
    boardApp = await createBoard(layout.boardHost, shell.board, shell.robots)

    setStatus(layout.actionStatus, shell.controls.status, 'idle')
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
        robotId: layout.orderRobotField.value,
        targetRobotId: layout.orderTargetField.value,
      })
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
      void runWorldAction(() => runResetShell(), 'Resetting mission state…')
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

    layout.orderRobotField.addEventListener('change', () => {
      refreshDraftFromLayout()
      layout.orderTargetField.value = orderDraft.targetRobotId
      syncOrderForm()
    })

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
        setStatus(layout.orderStatus, 'Queueing deterministic robot order…', 'idle')

        try {
          shell = await runQueueOrder(shell.autosave, buildBrowserOrderCommand(orderDraft))
          orderDraft = createOrderDraft(shell, orderDraft)
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
      })()
    })

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
