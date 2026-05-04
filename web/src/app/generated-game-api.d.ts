declare module '../generated/src/gameApi.mjs' {
  export function acknowledgeBrowserShell(autosave: string): Promise<unknown>
  export function advanceBrowserShell(autosave: string): Promise<unknown>
  export function bootstrap(): Promise<unknown>
  export function hydrateBrowserShell(autosave: string): Promise<unknown>
  export function resetBrowserShell(): Promise<unknown>
}
