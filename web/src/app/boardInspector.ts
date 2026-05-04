import {
  positionKey,
  positionLabel,
  tileAccessLabel,
  tileDetailLabel,
  tileKindLabel,
  tileTacticalNote,
  tileVisibilityLabel,
} from './boardPresentation'
import type { BrowserOrderDraft, BrowserShellOrderType } from './orders'
import type { AppBootstrap, BoardTileSummary, Position, RobotSummary } from './types'

export type BoardSelection =
  | { readonly kind: 'none' }
  | { readonly kind: 'robot'; readonly robotId: string }
  | { readonly kind: 'tile'; readonly position: Position }

export interface BoardInspectorStat {
  readonly full?: boolean
  readonly label: string
  readonly value: string
}

export interface BoardActionDescriptor {
  readonly actionKind: 'queue-order' | 'set-operator'
  readonly description: string
  readonly disabled: boolean
  readonly label: string
  readonly moveX?: string
  readonly moveY?: string
  readonly orderType?: BrowserShellOrderType
  readonly robotId?: string
  readonly targetRobotId?: string
  readonly variant: 'primary' | 'secondary'
}

export interface BoardInspectorModel {
  readonly actions: readonly BoardActionDescriptor[]
  readonly badge: string
  readonly eyebrow: string
  readonly hint: string
  readonly stats: readonly BoardInspectorStat[]
  readonly summary: string
  readonly title: string
}

export const NO_BOARD_SELECTION: BoardSelection = { kind: 'none' }

const canRobotHack = (robot: RobotSummary): boolean => robot.archetype === 'Mira Service Android'

const canRobotScan = (robot: RobotSummary): boolean => robot.archetype === 'Gecko Microcrawler'

const queueAction = (
  label: string,
  description: string,
  orderType: BrowserShellOrderType,
  options: {
    readonly disabled: boolean
    readonly moveX?: string
    readonly moveY?: string
    readonly robotId?: string
    readonly targetRobotId?: string
    readonly variant?: 'primary' | 'secondary'
  },
): BoardActionDescriptor => ({
  actionKind: 'queue-order',
  description,
  disabled: options.disabled,
  label,
  moveX: options.moveX,
  moveY: options.moveY,
  orderType,
  robotId: options.robotId,
  targetRobotId: options.targetRobotId,
  variant: options.variant ?? 'primary',
})

const setOperatorAction = (robot: RobotSummary): BoardActionDescriptor => ({
  actionKind: 'set-operator',
  description: `Switch the active board operator to ${robot.name}.`,
  disabled: false,
  label: `Use ${robot.name} as operator`,
  robotId: robot.id,
  variant: 'secondary',
})

const activeOperator = (shell: AppBootstrap, draft: BrowserOrderDraft): RobotSummary => {
  const selectedRobot = shell.robots.find((robot) => robot.id === draft.robotId)
  if (selectedRobot !== undefined) {
    return selectedRobot
  }

  const firstRobot = shell.robots[0]
  if (firstRobot === undefined) {
    throw new Error('The browser shell has no robots to inspect.')
  }

  return firstRobot
}

const boardHint = (shell: AppBootstrap): string =>
  shell.controls.canQueueOrders
    ? 'Board actions queue the same deterministic orders as the uplink below.'
    : shell.controls.status

const findSelectedRobot = (
  shell: AppBootstrap,
  selection: BoardSelection,
): RobotSummary | undefined =>
  selection.kind === 'robot'
    ? shell.robots.find((robot) => robot.id === selection.robotId)
    : undefined

const findSelectedTile = (
  shell: AppBootstrap,
  selection: BoardSelection,
): BoardTileSummary | undefined =>
  selection.kind === 'tile'
    ? shell.board.tiles.find(
        (tile) =>
          tile.position.x === selection.position.x && tile.position.y === selection.position.y,
      )
    : undefined

const findTileAtRobot = (shell: AppBootstrap, robot: RobotSummary): BoardTileSummary | undefined =>
  shell.board.tiles.find(
    (tile) => tile.position.x === robot.position.x && tile.position.y === robot.position.y,
  )

const operatorActions = (
  robot: RobotSummary,
  disabled: boolean,
): readonly BoardActionDescriptor[] => {
  const actions: BoardActionDescriptor[] = [
    queueAction(
      'Hold position',
      `Queue a safe no-op for ${robot.name}.`,
      'hold',
      {
        disabled,
        robotId: robot.id,
      },
    ),
  ]

  if (canRobotScan(robot)) {
    actions.push(
      queueAction(
        'Scan objective',
        `Use ${robot.name}'s fiber camera to locate the mission objective.`,
        'scan',
        {
          disabled,
          robotId: robot.id,
        },
      ),
    )
  }

  if (canRobotHack(robot)) {
    actions.push(
      queueAction(
        'Hack terminal',
        `Route ${robot.name} through the mission terminal target.`,
        'hack',
        {
          disabled,
          robotId: robot.id,
        },
      ),
    )
  }

  actions.push(
    queueAction(
      'Secure objective',
      `Have ${robot.name} attempt to secure the mission package.`,
      'interact',
      {
        disabled,
        robotId: robot.id,
      },
    ),
  )
  actions.push(
    queueAction(
      'Extract objective',
      `Tell ${robot.name} to extract once the package is secured.`,
      'extract',
      {
        disabled,
        robotId: robot.id,
      },
    ),
  )
  actions.push(
    queueAction(
      'Return to relay',
      `Pull ${robot.name} back to the relay anchor.`,
      'returnToRelay',
      {
        disabled,
        robotId: robot.id,
        variant: 'secondary',
      },
    ),
  )

  return actions
}

const robotInspector = (
  shell: AppBootstrap,
  draft: BrowserOrderDraft,
  selectedRobot: RobotSummary,
): BoardInspectorModel => {
  const operator = activeOperator(shell, draft)
  const robotTile = findTileAtRobot(shell, selectedRobot)
  const disabled = shell.controls.canQueueOrders === false
  const actions: BoardActionDescriptor[] = []

  if (selectedRobot.id !== operator.id) {
    actions.push(setOperatorAction(selectedRobot))
    actions.push(
      queueAction(
        `Follow ${selectedRobot.name}`,
        `Queue a follow order from ${operator.name} to ${selectedRobot.name}.`,
        'follow',
        {
          disabled,
          robotId: operator.id,
          targetRobotId: selectedRobot.id,
        },
      ),
    )
  }

  actions.push(...operatorActions(selectedRobot, disabled))

  return {
    actions,
    badge:
      selectedRobot.id === operator.id ? `Operator ${selectedRobot.id}` : `Operator ${operator.name}`,
    eyebrow: selectedRobot.id === operator.id ? 'Active operator' : 'Robot target',
    hint: boardHint(shell),
    stats: [
      { label: 'Battery', value: `${selectedRobot.battery}%` },
      { label: 'Signal', value: selectedRobot.signal },
      { label: 'Grid', value: positionLabel(selectedRobot.position) },
      { label: 'Location', value: selectedRobot.locationLabel, full: true },
      { label: 'Tile', value: tileDetailLabel(robotTile), full: true },
    ],
    summary:
      selectedRobot.id === operator.id
        ? `${selectedRobot.archetype} is primed for direct board-issued orders.`
        : `${selectedRobot.archetype} can be targeted directly or promoted to the active operator.`,
    title: selectedRobot.name,
  }
}

const tileInspector = (
  shell: AppBootstrap,
  draft: BrowserOrderDraft,
  selectedTile: BoardTileSummary,
): BoardInspectorModel => {
  const operator = activeOperator(shell, draft)
  const disabled = shell.controls.canQueueOrders === false
  const actions: BoardActionDescriptor[] = []
  const occupyingRobot = shell.robots.find(
    (robot) =>
      robot.position.x === selectedTile.position.x && robot.position.y === selectedTile.position.y,
  )

  if (selectedTile.walkable) {
    actions.push(
      queueAction(
        `Move ${operator.name} here`,
        `Queue a move order for ${operator.name} to ${positionLabel(selectedTile.position)}.`,
        'move',
        {
          disabled,
          moveX: String(selectedTile.position.x),
          moveY: String(selectedTile.position.y),
          robotId: operator.id,
        },
      ),
    )
  }

  switch (selectedTile.kind) {
    case 'objective':
      if (canRobotScan(operator)) {
        actions.push(
          queueAction(
            'Scan objective',
            `Use ${operator.name}'s uplink to locate the mission objective.`,
            'scan',
            {
              disabled,
              robotId: operator.id,
            },
          ),
        )
      }
      actions.push(
        queueAction(
          'Secure objective',
          `Have ${operator.name} attempt to secure the package from this tile.`,
          'interact',
          {
            disabled,
            robotId: operator.id,
          },
        ),
      )
      actions.push(
        queueAction(
          'Extract objective',
          `Extract the secured package with ${operator.name}.`,
          'extract',
          {
            disabled,
            robotId: operator.id,
            variant: 'secondary',
          },
        ),
      )
      break
    case 'relay':
      actions.push(
        queueAction(
          'Return to relay',
          `Route ${operator.name} back to the relay anchor.`,
          'returnToRelay',
          {
            disabled,
            robotId: operator.id,
            variant: 'secondary',
          },
        ),
      )
      break
    case 'terminal':
      actions.push(
        queueAction(
          'Hack terminal',
          `Use ${operator.name} to hack the exposed terminal target.`,
          'hack',
          {
            disabled,
            robotId: operator.id,
          },
        ),
      )
      break
  }

  return {
    actions,
    badge: `Operator ${operator.name}`,
    eyebrow: 'Tile target',
    hint:
      actions.length > 0
        ? boardHint(shell)
        : `${boardHint(shell)} Pick a robot or a more actionable tile to queue a direct command.`,
    stats: [
      { label: 'Visibility', value: tileVisibilityLabel(selectedTile) },
      { label: 'Access', value: tileAccessLabel(selectedTile) },
      { label: 'Grid', value: positionLabel(selectedTile.position) },
      { label: 'Occupant', value: occupyingRobot?.name ?? 'None', full: true },
    ],
    summary: tileTacticalNote(selectedTile),
    title: tileKindLabel(selectedTile.kind),
  }
}

const defaultInspector = (
  shell: AppBootstrap,
  draft: BrowserOrderDraft,
): BoardInspectorModel => {
  const operator = activeOperator(shell, draft)
  const operatorTile = findTileAtRobot(shell, operator)
  return {
    actions: operatorActions(operator, shell.controls.canQueueOrders === false),
    badge: `Operator ${operator.id}`,
    eyebrow: 'Board uplink',
    hint: 'Click a robot to target it directly, or click a tile to expose contextual board actions.',
    stats: [
      { label: 'Archetype', value: operator.archetype },
      { label: 'Signal', value: operator.signal },
      { label: 'Grid', value: positionLabel(operator.position) },
      { label: 'Location', value: tileDetailLabel(operatorTile), full: true },
    ],
    summary: `${operator.name} is the current operator for tile-driven board actions.`,
    title: operator.name,
  }
}

export const createBoardInspectorModel = (
  shell: AppBootstrap,
  draft: BrowserOrderDraft,
  selection: BoardSelection,
): BoardInspectorModel => {
  const selectedRobot = findSelectedRobot(shell, selection)
  if (selectedRobot !== undefined) {
    return robotInspector(shell, draft, selectedRobot)
  }

  const selectedTile = findSelectedTile(shell, selection)
  if (selectedTile !== undefined) {
    return tileInspector(shell, draft, selectedTile)
  }

  return defaultInspector(shell, draft)
}

export const normalizeBoardSelection = (
  shell: AppBootstrap,
  selection: BoardSelection,
): BoardSelection => {
  switch (selection.kind) {
    case 'none':
      return selection
    case 'robot':
      return shell.robots.some((robot) => robot.id === selection.robotId)
        ? selection
        : NO_BOARD_SELECTION
    case 'tile':
      return shell.board.tiles.some(
        (tile) => positionKey(tile.position.x, tile.position.y) === positionKey(selection.position.x, selection.position.y),
      )
        ? selection
        : NO_BOARD_SELECTION
  }
}
