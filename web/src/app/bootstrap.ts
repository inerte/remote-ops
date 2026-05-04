import { bootstrap } from '../generated/src/gameApi.mjs'
import type { AppBootstrap } from './types'

export const loadBootstrap = async (): Promise<AppBootstrap> =>
  (await bootstrap()) as AppBootstrap
