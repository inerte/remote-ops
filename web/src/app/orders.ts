import type { AppBootstrap } from './types'

export type BrowserShellOrderType =
  | 'hold'
  | 'move'
  | 'follow'
  | 'scan'
  | 'hack'
  | 'interact'
  | 'extract'
  | 'returnToRelay'

export interface BrowserOrderDraft {
  readonly moveX: string
  readonly moveY: string
  readonly orderType: BrowserShellOrderType
  readonly robotId: string
  readonly targetRobotId: string
}

type SigilVariant<Tag extends string, Fields extends readonly unknown[]> = {
  readonly __fields: Fields
  readonly __tag: Tag
}

export type BrowserOrderCommand =
  | SigilVariant<'BrowserExtract', readonly [string]>
  | SigilVariant<'BrowserFollow', readonly [string, string]>
  | SigilVariant<'BrowserHack', readonly [string]>
  | SigilVariant<'BrowserHold', readonly [string]>
  | SigilVariant<'BrowserInteract', readonly [string]>
  | SigilVariant<'BrowserMove', readonly [string, { readonly x: number; readonly y: number }]>
  | SigilVariant<'BrowserReturnToRelay', readonly [string]>
  | SigilVariant<'BrowserScan', readonly [string]>

export interface BrowserOrderOption {
  readonly description: string
  readonly label: string
  readonly value: BrowserShellOrderType
}

export const ORDER_OPTIONS: readonly BrowserOrderOption[] = [
  {
    value: 'hold',
    label: 'Hold position',
    description: 'Queue a safe no-op while you line up the next deterministic action.',
  },
  {
    value: 'move',
    label: 'Move to grid',
    description: 'Send the selected robot to an explicit packet-grid coordinate.',
  },
  {
    value: 'follow',
    label: 'Follow robot',
    description: 'Attach the selected robot to another robot’s current position.',
  },
  {
    value: 'scan',
    label: 'Scan objective',
    description: 'Use a fiber camera to locate the objective before interacting with it.',
  },
  {
    value: 'hack',
    label: 'Hack terminal',
    description: 'Use the selected robot to attack the exposed mission terminal.',
  },
  {
    value: 'interact',
    label: 'Secure objective',
    description: 'Attempt to secure the located objective with the selected robot.',
  },
  {
    value: 'extract',
    label: 'Extract objective',
    description: 'Exit with the secured objective once the selected robot is carrying it.',
  },
  {
    value: 'returnToRelay',
    label: 'Return to relay',
    description: 'Pull the robot back to the relay anchor without inventing a custom path.',
  },
] as const

const DEFAULT_ORDER_TYPE: BrowserShellOrderType = 'hold'

const findOrderOption = (orderType: BrowserShellOrderType): BrowserOrderOption => {
  const option = ORDER_OPTIONS.find((candidate) => candidate.value === orderType)
  if (option === undefined) {
    throw new Error(`Unknown browser order type: ${orderType}`)
  }

  return option
}

const parseCoordinate = (value: string, axis: 'X' | 'Y'): number => {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    throw new Error(`Enter a ${axis}-coordinate before queueing a move order.`)
  }

  if (/^-?\d+$/.test(trimmed) === false) {
    throw new Error(`${axis}-coordinate must be a whole number.`)
  }

  return Number.parseInt(trimmed, 10)
}

const resolveFallbackRobot = (shell: AppBootstrap): AppBootstrap['robots'][number] => {
  const firstRobot = shell.robots[0]
  if (firstRobot === undefined) {
    throw new Error('The browser shell has no robots to order.')
  }

  return firstRobot
}

const resolveFollowTargetId = (
  shell: AppBootstrap,
  robotId: string,
  targetRobotId: string | undefined,
): string => {
  if (
    targetRobotId !== undefined &&
    shell.robots.some((candidate) => candidate.id === targetRobotId && candidate.id !== robotId)
  ) {
    return targetRobotId
  }

  return shell.robots.find((candidate) => candidate.id !== robotId)?.id ?? robotId
}

const resolveOrderType = (
  value: BrowserOrderDraft['orderType'] | undefined,
): BrowserOrderDraft['orderType'] =>
  value !== undefined && ORDER_OPTIONS.some((candidate) => candidate.value === value)
    ? value
    : DEFAULT_ORDER_TYPE

export const buildBrowserOrderCommand = (draft: BrowserOrderDraft): BrowserOrderCommand => {
  switch (draft.orderType) {
    case 'extract':
      return { __fields: [draft.robotId], __tag: 'BrowserExtract' }
    case 'follow':
      return { __fields: [draft.robotId, draft.targetRobotId], __tag: 'BrowserFollow' }
    case 'hack':
      return { __fields: [draft.robotId], __tag: 'BrowserHack' }
    case 'hold':
      return { __fields: [draft.robotId], __tag: 'BrowserHold' }
    case 'interact':
      return { __fields: [draft.robotId], __tag: 'BrowserInteract' }
    case 'move':
      return {
        __fields: [
          draft.robotId,
          {
            x: parseCoordinate(draft.moveX, 'X'),
            y: parseCoordinate(draft.moveY, 'Y'),
          },
        ],
        __tag: 'BrowserMove',
      }
    case 'returnToRelay':
      return { __fields: [draft.robotId], __tag: 'BrowserReturnToRelay' }
    case 'scan':
      return { __fields: [draft.robotId], __tag: 'BrowserScan' }
  }
}

export const createOrderDraft = (
  shell: AppBootstrap,
  draft?: Partial<BrowserOrderDraft>,
): BrowserOrderDraft => {
  const fallbackRobot = resolveFallbackRobot(shell)
  const selectedRobot =
    shell.robots.find((candidate) => candidate.id === draft?.robotId) ?? fallbackRobot

  return {
    moveX: draft?.moveX ?? String(selectedRobot.position.x),
    moveY: draft?.moveY ?? String(selectedRobot.position.y),
    orderType: resolveOrderType(draft?.orderType),
    robotId: selectedRobot.id,
    targetRobotId: resolveFollowTargetId(shell, selectedRobot.id, draft?.targetRobotId),
  }
}

export const orderTypeDescription = (orderType: BrowserShellOrderType): string =>
  findOrderOption(orderType).description

export const orderTypeNeedsPosition = (orderType: BrowserShellOrderType): boolean =>
  orderType === 'move'

export const orderTypeNeedsTargetRobot = (orderType: BrowserShellOrderType): boolean =>
  orderType === 'follow'
