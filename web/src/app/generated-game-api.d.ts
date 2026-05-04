import type { BrowserOrderCommand } from './orders'

declare module '../generated/src/gameApi.mjs' {
  export function acknowledgeBrowserShell(autosave: string): Promise<unknown>
  export function advanceBrowserShell(autosave: string): Promise<unknown>
  export function bootstrap(): Promise<unknown>
  export function hydrateBrowserShell(autosave: string): Promise<unknown>
  export function queueBrowserOrder(
    autosave: string,
    command: BrowserOrderCommand,
  ): Promise<unknown>
  export function resetBrowserShell(): Promise<unknown>
}
