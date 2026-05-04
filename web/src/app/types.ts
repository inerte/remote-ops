export interface Position {
  readonly x: number
  readonly y: number
}

export interface BoardSummary {
  readonly height: number
  readonly width: number
}

export interface ControlSummary {
  readonly canAcknowledge: boolean
  readonly canAdvance: boolean
  readonly canReset: boolean
  readonly status: string
}

export interface EventEntry {
  readonly message: string
  readonly turn: number
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

export interface AppBootstrap {
  readonly autosave: string
  readonly board: BoardSummary
  readonly controls: ControlSummary
  readonly eventLog: readonly EventEntry[]
  readonly interrupts: readonly string[]
  readonly mission: MissionSummary
  readonly packets: readonly PacketSummary[]
  readonly robots: readonly RobotSummary[]
  readonly tagline: string
  readonly title: string
}
