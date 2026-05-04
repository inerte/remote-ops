import { loadBootstrap } from './app/bootstrap'
import { createBoard } from './renderer/board'
import './styles/app.css'
import { renderLayout } from './ui/layout'

const AUTOSAVE_STORAGE_KEY = 'remote-ops.autosave'

const setExportStatus = (
  statusElement: HTMLParagraphElement,
  text: string,
  state: 'idle' | 'success' | 'error',
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

const persistAutosave = (
  autosave: string,
): { readonly state: 'success' | 'error'; readonly text: string } => {
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

const main = async (): Promise<void> => {
  const app = document.querySelector<HTMLDivElement>('#app')
  if (app === null) {
    throw new Error('App root #app was not found.')
  }

  const bootstrap = await loadBootstrap()
  const autosaveStatus = persistAutosave(bootstrap.autosave)
  const layout = renderLayout(app, bootstrap)

  await createBoard(layout.boardHost, bootstrap.board, bootstrap.robots)

  layout.autosaveButton.addEventListener('click', () => {
    void copyText(bootstrap.autosave)
      .then(() => {
        setExportStatus(layout.packetStatus, 'Autosave payload copied to the clipboard.', 'success')
      })
      .catch((error: unknown) => {
        setExportStatus(layout.packetStatus, formatError(error), 'error')
      })
  })

  for (const button of layout.packetButtons) {
    button.addEventListener('click', () => {
      const packetId = button.dataset.packetId
      if (packetId === undefined) {
        throw new Error('Packet button is missing its data-packet-id attribute.')
      }

      const packet = bootstrap.packets.find((candidate) => candidate.id === packetId)
      if (packet === undefined) {
        throw new Error(`Unknown packet requested: ${packetId}`)
      }

      void copyText(packet.body)
        .then(() => {
          setExportStatus(layout.packetStatus, `${packet.label} copied to the clipboard.`, 'success')
        })
        .catch((error: unknown) => {
          setExportStatus(layout.packetStatus, formatError(error), 'error')
        })
    })
  }

  setExportStatus(
    layout.packetStatus,
    autosaveStatus.text,
    autosaveStatus.state,
  )
}

void main()
