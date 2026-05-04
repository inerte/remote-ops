import * as gameApiModule from '../generated/src/gameApi.mjs'
import type { AppBootstrap } from './types'

interface GameApiModule {
  readonly acknowledgeBrowserShell: (autosave: string) => Promise<unknown>
  readonly advanceBrowserShell: (autosave: string) => Promise<unknown>
  readonly bootstrap: () => Promise<unknown>
  readonly hydrateBrowserShell: (autosave: string) => Promise<unknown>
  readonly resetBrowserShell: () => Promise<unknown>
}

const gameApi = gameApiModule as unknown as GameApiModule

export const loadBootstrap = async (): Promise<AppBootstrap> =>
  (await gameApi.bootstrap()) as AppBootstrap

export const loadHydratedShell = async (autosave: string): Promise<AppBootstrap> =>
  (await gameApi.hydrateBrowserShell(autosave)) as AppBootstrap

export const runAdvanceShell = async (autosave: string): Promise<AppBootstrap> =>
  (await gameApi.advanceBrowserShell(autosave)) as AppBootstrap

export const runAcknowledgeShell = async (autosave: string): Promise<AppBootstrap> =>
  (await gameApi.acknowledgeBrowserShell(autosave)) as AppBootstrap

export const runResetShell = async (): Promise<AppBootstrap> =>
  (await gameApi.resetBrowserShell()) as AppBootstrap
