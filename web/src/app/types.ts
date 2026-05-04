export interface Position {
  readonly x: number
  readonly y: number
}

export type BoardTileKind =
  | 'duct'
  | 'door'
  | 'entry'
  | 'floor'
  | 'objective'
  | 'relay'
  | 'terminal'
  | 'wall'

export interface BoardTileSummary {
  readonly kind: BoardTileKind
  readonly label: string
  readonly position: Position
  readonly revealed: boolean
  readonly walkable: boolean
}

export interface BoardSummary {
  readonly height: number
  readonly tiles: readonly BoardTileSummary[]
  readonly width: number
}

export interface ContractLobbySummary {
  readonly contractId: string
  readonly corporation: string
  readonly label: string
  readonly objective: string
  readonly risk: string
  readonly selected: boolean
  readonly summary: string
}

export interface ControlSummary {
  readonly canAcknowledge: boolean
  readonly canAdvance: boolean
  readonly canQueueOrders: boolean
  readonly canReset: boolean
  readonly status: string
}

export interface DebriefSummary {
  readonly isTerminal: boolean
  readonly keyEvents: readonly string[]
  readonly nextStep: string
  readonly outcome: string
  readonly summary: string
  readonly tone: string
}

export interface EventEntry {
  readonly message: string
  readonly turn: number
}

export interface MissionConfigOptionSummary {
  readonly effects: readonly string[]
  readonly id: string
  readonly label: string
  readonly selected: boolean
  readonly summary: string
}

export interface MissionSummary {
  readonly alarmLevel: string
  readonly corporation: string
  readonly exposure: number
  readonly missionClock: string
  readonly missionStatus: string
  readonly objective: string
  readonly objectiveStatus: string
  readonly pendingInterrupts: number
  readonly queuedOrders: number
  readonly siteLabel: string
  readonly trace: number
  readonly turn: number
}

export interface RobotSummary {
  readonly archetype: string
  readonly battery: number
  readonly id: string
  readonly locationLabel: string
  readonly name: string
  readonly position: Position
  readonly signal: string
}

export interface PacketSummary {
  readonly body: string
  readonly id: string
  readonly label: string
}

export type ShellStageId = 'config' | 'lobby' | 'mission'

export interface ShellSummary {
  readonly activeStage: ShellStageId
  readonly configOptions: readonly MissionConfigOptionSummary[]
  readonly contractOptions: readonly ContractLobbySummary[]
  readonly selectedConfigId: string
  readonly selectedContractId: string
  readonly stageSummary: string
  readonly stageTitle: string
}

export interface AppBootstrap {
  readonly autosave: string
  readonly board: BoardSummary
  readonly controls: ControlSummary
  readonly debrief: DebriefSummary
  readonly eventLog: readonly EventEntry[]
  readonly interrupts: readonly string[]
  readonly mission: MissionSummary
  readonly packets: readonly PacketSummary[]
  readonly robots: readonly RobotSummary[]
  readonly shell: ShellSummary
  readonly tagline: string
  readonly title: string
}
