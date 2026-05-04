import {
  loadBootstrap,
  loadHydratedShell,
  runAcknowledgeShell,
  runAdvanceShell,
  runResetShell,
} from './app/bootstrap'
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

const loadInitialShell = async (): Promise<AppBootstrap> => {
  const storedAutosave = readStoredAutosave()
  if (storedAutosave === null) {
    return loadBootstrap()
  }

  return loadHydratedShell(storedAutosave)
}

const main = async (): Promise<void> => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app === null) {
    throw new Error('App root #app was not found.')
  }

  let boardApp: BoardHandle | null = null
  let shell = await loadInitialShell()
  let exportStatus = persistAutosave(shell.autosave)

  const render = async (): Promise<void> => {
    boardApp?.destroy()

    const layout = renderLayout(app, shell)
    boardApp = await createBoard(layout.boardHost, shell.board, shell.robots)

    setStatus(layout.actionStatus, shell.controls.status, 'idle')
    setStatus(layout.packetStatus, exportStatus.text, exportStatus.state)

    const runWorldAction = async (
      operation: () => Promise<AppBootstrap>,
      busyText: string,
    ): Promise<void> => {
      setStatus(layout.actionStatus, busyText, 'idle')

      try {
        shell = await operation()
        exportStatus = persistAutosave(shell.autosave)
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
          setStatus(layout.packetStatus, 'Autosave payload copied to the clipboard.', 'success')
        })
        .catch((error: unknown) => {
          setStatus(layout.packetStatus, formatError(error), 'error')
        })
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
  }

  await render()
}

void main()
