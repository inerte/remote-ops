import type { BoardTileKind, BoardTileSummary, Position } from './types'

export const positionKey = (x: number, y: number): string => `${x},${y}`

export const positionLabel = (position: Position): string => `${position.x}, ${position.y}`

export const tileDetailLabel = (tile: BoardTileSummary | undefined): string => {
  if (tile === undefined) {
    return 'Off-map'
  }

  return tile.revealed ? tile.label : `${tile.label} · obscured`
}

export const tileKindLabel = (kind: BoardTileKind): string => {
  switch (kind) {
    case 'duct':
      return 'Access duct'
    case 'door':
      return 'Security door'
    case 'entry':
      return 'Entry point'
    case 'floor':
      return 'Operational floor'
    case 'objective':
      return 'Mission objective'
    case 'relay':
      return 'Relay node'
    case 'terminal':
      return 'Network terminal'
    case 'wall':
      return 'Structural wall'
  }
}

export const tileVisibilityLabel = (tile: BoardTileSummary): string =>
  tile.revealed ? 'Revealed' : 'Obscured'

export const tileAccessLabel = (tile: BoardTileSummary): string => {
  if (tile.kind === 'wall') {
    return 'Impassable'
  }

  return tile.walkable ? 'Walkable' : 'Blocked'
}

export const tileTacticalNote = (tile: BoardTileSummary): string => {
  switch (tile.kind) {
    case 'duct':
      return tile.revealed
        ? 'Low-profile route for covert repositioning and microcrawler movement.'
        : 'A concealed access route is present, but current intel is incomplete.'
    case 'door':
      return tile.walkable
        ? 'This choke point is currently open for route planning.'
        : 'Movement stalls here until the crew opens, bypasses, or breaches the door.'
    case 'entry':
      return 'Primary insertion or fallback extraction lane for the operation.'
    case 'floor':
      return tile.revealed
        ? 'Known traversable interior space for safe operator routing.'
        : 'Interior route exists here, but the tactical picture is still incomplete.'
    case 'objective':
      return tile.revealed
        ? 'Mission-critical asset location once the crew can secure it.'
        : 'Objective signature is flagged here, but the exact state remains obscured.'
    case 'relay':
      return 'Signal anchor point for keeping remote units online and coordinated.'
    case 'terminal':
      return 'Network access point for hacks, intel pulls, or subsystem control.'
    case 'wall':
      return 'Hard structural boundary; plan routes around it.'
  }
}
