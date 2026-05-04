export interface Position {
  readonly x: number
  readonly y: number
}

export interface BoardSummary {
  readonly height: number
  readonly width: number
}

export interface MissionSummary {
  readonly alarmLevel: string
  readonly corporation: string
  readonly missionClock: string
  readonly objective: string
  readonly trace: number
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
  readonly mission: MissionSummary
  readonly nextSteps: readonly string[]
  readonly packets: readonly PacketSummary[]
  readonly robots: readonly RobotSummary[]
  readonly tagline: string
  readonly title: string
}
