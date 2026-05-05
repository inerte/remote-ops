import { Application, Container, Graphics, Text } from 'pixi.js'
import { positionKey, tileAccessLabel, tileDetailLabel, tileKindLabel, tileTacticalNote, tileVisibilityLabel } from '../app/boardPresentation'
import type { BoardSelection } from '../app/boardInspector'
import type { BoardSummary, BoardTileKind, BoardTileSummary, RobotSummary } from '../app/types'

type RenderedTileKind = BoardTileKind | 'void'

type TilePalette = {
  readonly accent: number
  readonly border: number
  readonly fill: number
}

const HUD_HEIGHT = 30
const TILE_GAP = 6
const TOOLTIP_EDGE_PADDING = 12
const TOOLTIP_OFFSET = 14

const TILE_PALETTES: Record<RenderedTileKind, TilePalette> = {
  duct: {
    accent: 0x5eead4,
    border: 0x2dd4bf,
    fill: 0x0c2430,
  },
  door: {
    accent: 0xfde68a,
    border: 0xf59e0b,
    fill: 0x2b200d,
  },
  entry: {
    accent: 0xbbf7d0,
    border: 0x34d399,
    fill: 0x0e2b1f,
  },
  floor: {
    accent: 0x7dd3fc,
    border: 0x4b6b92,
    fill: 0x13233b,
  },
  objective: {
    accent: 0xf9a8d4,
    border: 0xec4899,
    fill: 0x2b1432,
  },
  relay: {
    accent: 0x93c5fd,
    border: 0x60a5fa,
    fill: 0x10273f,
  },
  terminal: {
    accent: 0x67e8f9,
    border: 0x38bdf8,
    fill: 0x102a38,
  },
  void: {
    accent: 0x1f314b,
    border: 0x162437,
    fill: 0x070f1d,
  },
  wall: {
    accent: 0xe2e8f0,
    border: 0x94a3b8,
    fill: 0x182232,
  },
}

const archetypeColor = (archetype: string): number => {
  switch (archetype) {
    case 'Gecko Microcrawler':
      return 0x6ee7b7
    case 'Mira Service Android':
      return 0xf9a8d4
    case 'Atlas Breacher':
      return 0xf59e0b
    case 'Wisp Relay Drone':
      return 0x60a5fa
    default:
      return 0xe5e7eb
  }
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

interface BoardInteractionOptions {
  readonly activeRobotId?: string
  readonly onSelectRobot?: (robot: RobotSummary) => void
  readonly onSelectTile?: (tile: BoardTileSummary) => void
  readonly selection?: BoardSelection
}

const drawFrame = (
  stage: Container,
  originX: number,
  originY: number,
  width: number,
  height: number,
): void => {
  const shadow = new Graphics()
  shadow.roundRect(originX - 12, originY - 12, width + 28, height + 28, 24).fill({
    alpha: 0.42,
    color: 0x020617,
  })
  shadow.x = 4
  shadow.y = 6
  stage.addChild(shadow)

  const frame = new Graphics()
  frame
    .roundRect(originX - 12, originY - 12, width + 28, height + 28, 24)
    .fill({
      alpha: 0.96,
      color: 0x06111f,
    })
    .stroke({
      alpha: 0.78,
      color: 0x1e3a5f,
      width: 1.5,
    })
  stage.addChild(frame)

  const inset = new Graphics()
  inset
    .roundRect(originX - 4, originY - 4, width + 12, height + 12, 18)
    .stroke({
      alpha: 0.18,
      color: 0x7dd3fc,
      width: 1,
    })
  stage.addChild(inset)
}

const drawTileAccent = (
  graphic: Graphics,
  kind: RenderedTileKind,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number,
): void => {
  const centerX = x + size / 2
  const centerY = y + size / 2

  switch (kind) {
    case 'duct':
      for (const offset of [0.26, 0.5, 0.74]) {
        graphic
          .roundRect(x + size * 0.24, y + size * offset - size * 0.04, size * 0.52, size * 0.08, 3)
          .fill({ alpha, color })
      }
      break
    case 'door':
      graphic
        .roundRect(x + size * 0.34, y + size * 0.18, size * 0.32, size * 0.64, 6)
        .stroke({ alpha, color, width: 2 })
      graphic
        .roundRect(x + size * 0.485, y + size * 0.22, size * 0.03, size * 0.56, 2)
        .fill({ alpha, color })
      graphic.circle(x + size * 0.59, y + size * 0.52, Math.max(2, size * 0.035)).fill({ alpha, color })
      break
    case 'entry':
      graphic
        .moveTo(x + size * 0.22, centerY)
        .lineTo(x + size * 0.68, centerY)
        .lineTo(x + size * 0.54, y + size * 0.32)
        .moveTo(x + size * 0.68, centerY)
        .lineTo(x + size * 0.54, y + size * 0.68)
        .stroke({ alpha, color, width: 2.4 })
      break
    case 'floor':
      graphic
        .moveTo(x + size * 0.28, centerY)
        .lineTo(x + size * 0.72, centerY)
        .moveTo(centerX, y + size * 0.28)
        .lineTo(centerX, y + size * 0.72)
        .stroke({ alpha: alpha * 0.9, color, width: 1.8 })
      graphic.circle(centerX, centerY, Math.max(2, size * 0.06)).fill({ alpha, color })
      break
    case 'objective':
      graphic
        .moveTo(centerX, y + size * 0.18)
        .lineTo(x + size * 0.78, centerY)
        .lineTo(centerX, y + size * 0.82)
        .lineTo(x + size * 0.22, centerY)
        .lineTo(centerX, y + size * 0.18)
        .stroke({ alpha, color, width: 2.2 })
      graphic.circle(centerX, centerY, Math.max(2, size * 0.05)).fill({ alpha, color })
      break
    case 'relay':
      graphic.circle(centerX, centerY, size * 0.22).stroke({ alpha, color, width: 2 })
      graphic.circle(centerX, centerY, Math.max(2, size * 0.06)).fill({ alpha, color })
      graphic
        .moveTo(centerX - size * 0.32, centerY)
        .lineTo(centerX + size * 0.32, centerY)
        .moveTo(centerX, centerY - size * 0.32)
        .lineTo(centerX, centerY + size * 0.32)
        .stroke({ alpha: alpha * 0.8, color, width: 1.5 })
      break
    case 'terminal':
      graphic
        .roundRect(x + size * 0.24, y + size * 0.24, size * 0.52, size * 0.34, 4)
        .stroke({ alpha, color, width: 2 })
      graphic.roundRect(x + size * 0.42, y + size * 0.6, size * 0.16, size * 0.08, 2).fill({
        alpha,
        color,
      })
      graphic.roundRect(x + size * 0.34, y + size * 0.7, size * 0.32, size * 0.05, 2).fill({
        alpha: alpha * 0.9,
        color,
      })
      break
    case 'wall':
      for (const offset of [0.26, 0.5, 0.74]) {
        graphic
          .roundRect(x + size * 0.2, y + size * offset - size * 0.05, size * 0.6, size * 0.1, 4)
          .fill({ alpha, color })
      }
      break
    case 'void':
      graphic
        .moveTo(x + size * 0.32, centerY)
        .lineTo(x + size * 0.68, centerY)
        .moveTo(centerX, y + size * 0.32)
        .lineTo(centerX, y + size * 0.68)
        .stroke({ alpha: alpha * 0.6, color, width: 1.2 })
      break
  }
}

const drawTile = (
  stage: Container,
  tile: BoardTileSummary | undefined,
  x: number,
  y: number,
  size: number,
): void => {
  const kind: RenderedTileKind = tile?.kind ?? 'void'
  const palette = TILE_PALETTES[kind]
  const isVoid = tile === undefined
  const alpha = tile?.revealed === false ? 0.72 : isVoid ? 0.55 : 1
  const borderWidth = tile?.walkable === false ? 2.1 : 1.4

  if (kind !== 'void') {
    const glow = new Graphics()
    glow
      .roundRect(x + 2, y + 2, size - 4, size - 4, 10)
      .fill({
        alpha: tile?.revealed === false ? 0.05 : kind === 'floor' ? 0.04 : 0.1,
        color: palette.accent,
      })
    stage.addChild(glow)
  }

  const shadow = new Graphics()
  shadow.roundRect(x + 1, y + 3, size, size, 12).fill({
    alpha: isVoid ? 0.22 : 0.38,
    color: 0x020617,
  })
  stage.addChild(shadow)

  const base = new Graphics()
  base
    .roundRect(x, y, size, size, 12)
    .fill({ alpha, color: palette.fill })
    .stroke({
      alpha: isVoid ? 0.3 : 0.82,
      color: palette.border,
      width: borderWidth,
    })
  stage.addChild(base)

  const sheen = new Graphics()
  sheen
    .roundRect(x + 1, y + 1, size - 2, size * 0.3, 10)
    .fill({
      alpha: isVoid ? 0.04 : 0.08,
      color: 0xffffff,
    })
  stage.addChild(sheen)

  const accent = new Graphics()
  drawTileAccent(accent, kind, x, y, size, palette.accent, tile?.revealed === false ? 0.5 : 0.9)
  stage.addChild(accent)

  if (tile?.walkable === false && kind !== 'wall') {
    const lockBar = new Graphics()
    lockBar
      .moveTo(x + size * 0.24, y + size * 0.24)
      .lineTo(x + size * 0.76, y + size * 0.76)
      .moveTo(x + size * 0.76, y + size * 0.24)
      .lineTo(x + size * 0.24, y + size * 0.76)
      .stroke({
        alpha: 0.4,
        color: 0xf8fafc,
        width: 1.5,
      })
    stage.addChild(lockBar)
  }

  if (tile?.revealed === false) {
    const obscured = new Graphics()
    for (let offset = 0; offset <= size; offset += 6) {
      obscured
        .moveTo(x + size * 0.18, y + offset)
        .lineTo(x + size * 0.82, y + offset)
    }
    obscured.stroke({
      alpha: 0.18,
      color: 0x7dd3fc,
      width: 1,
    })
    stage.addChild(obscured)
  }
}

export const createBoard = async (
  host: HTMLElement,
  board: BoardSummary,
  robots: readonly RobotSummary[],
  interaction?: BoardInteractionOptions,
): Promise<Application> => {
  const app = new Application()
  const hostStyle = getComputedStyle(host)
  const hostPaddingX = parseFloat(hostStyle.paddingLeft) + parseFloat(hostStyle.paddingRight)
  const hostPaddingY = parseFloat(hostStyle.paddingTop) + parseFloat(hostStyle.paddingBottom)
  const hostWidth = Math.max(520, Math.floor(host.clientWidth - hostPaddingX))
  const hostHeight = Math.max(420, Math.floor(host.clientHeight - hostPaddingY))

  const wrapper = document.createElement('div')
  wrapper.className = 'board-stage'
  wrapper.style.width = `${hostWidth}px`
  wrapper.style.height = `${hostHeight}px`
  host.replaceChildren(wrapper)

  await app.init({
    antialias: true,
    background: '#09111f',
    resizeTo: wrapper,
  })

  const tileLayer = document.createElement('div')
  tileLayer.className = 'board-tile-layer'

  const robotLayer = document.createElement('div')
  robotLayer.className = 'board-robot-layer'

  const tooltip = document.createElement('div')
  tooltip.className = 'board-tooltip'
  tooltip.setAttribute('aria-live', 'polite')

  wrapper.append(app.canvas, tileLayer, robotLayer, tooltip)

  const stage = new Container()
  app.stage.addChild(stage)

  const padding = 28
  const tileSize = Math.min(
    56,
    Math.max(
      34,
      Math.floor(
        Math.min(
          (hostWidth - padding * 2) / board.width,
          (hostHeight - padding * 2 - HUD_HEIGHT) / board.height,
        ),
      ),
    ),
  )
  const boardPixelWidth = tileSize * board.width
  const boardPixelHeight = tileSize * board.height
  const originX = Math.floor((hostWidth - boardPixelWidth) / 2)
  const originY = HUD_HEIGHT + Math.floor((hostHeight - HUD_HEIGHT - boardPixelHeight) / 2)
  const tileSizeInner = tileSize - TILE_GAP
  const tileLookup = new Map(board.tiles.map((tile) => [positionKey(tile.position.x, tile.position.y), tile]))
  const selectedRobotId =
    interaction?.selection?.kind === 'robot' ? interaction.selection.robotId : undefined
  const selectedTileKey =
    interaction?.selection?.kind === 'tile'
      ? positionKey(interaction.selection.position.x, interaction.selection.position.y)
      : undefined

  drawFrame(stage, originX, originY, boardPixelWidth, boardPixelHeight)

  const legend = new Text({
    text: 'SIGIL STATE · TACTICAL BOARD',
    style: {
      fill: '#7dd3fc',
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 1.4,
    },
  })
  legend.x = padding
  legend.y = 10
  stage.addChild(legend)

  const hint = new Text({
    text: 'Hover or focus tiles and robot markers for tactical intel',
    style: {
      fill: '#8ba4d0',
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 10,
      letterSpacing: 0.8,
    },
  })
  hint.x = padding
  hint.y = 26
  stage.addChild(hint)

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      drawTile(
        stage,
        tileLookup.get(positionKey(x, y)),
        originX + x * tileSize + TILE_GAP / 2,
        originY + y * tileSize + TILE_GAP / 2,
        tileSizeInner,
      )
    }
  }

  let activeHotspot: HTMLButtonElement | null = null

  const positionTooltip = (centerX: number, centerY: number): void => {
    const maxWidth = Math.min(260, wrapper.clientWidth - TOOLTIP_EDGE_PADDING * 2)
    tooltip.style.maxWidth = `${maxWidth}px`

    const tooltipWidth = tooltip.offsetWidth
    const tooltipHeight = tooltip.offsetHeight
    const left = clamp(
      centerX - tooltipWidth / 2,
      TOOLTIP_EDGE_PADDING,
      Math.max(TOOLTIP_EDGE_PADDING, wrapper.clientWidth - tooltipWidth - TOOLTIP_EDGE_PADDING),
    )
    const preferredTop = centerY - tooltipHeight - TOOLTIP_OFFSET
    const top = clamp(
      preferredTop >= TOOLTIP_EDGE_PADDING ? preferredTop : centerY + TOOLTIP_OFFSET,
      TOOLTIP_EDGE_PADDING,
      Math.max(TOOLTIP_EDGE_PADDING, wrapper.clientHeight - tooltipHeight - TOOLTIP_EDGE_PADDING),
    )

    tooltip.style.left = `${Math.round(left)}px`
    tooltip.style.top = `${Math.round(top)}px`
  }

  const showTooltip = (content: string, centerX: number, centerY: number, hotspot: HTMLButtonElement): void => {
    activeHotspot?.removeAttribute('data-active')
    hotspot.dataset.active = 'true'
    activeHotspot = hotspot

    tooltip.innerHTML = content
    tooltip.dataset.visible = 'true'
    positionTooltip(centerX, centerY)
  }

  const clearTooltip = (): void => {
    activeHotspot?.removeAttribute('data-active')
    activeHotspot = null
    tooltip.dataset.visible = 'false'
  }

  const showRobotTooltip = (
    robot: RobotSummary,
    tile: BoardTileSummary | undefined,
    centerX: number,
    centerY: number,
    hotspot: HTMLButtonElement,
  ): void => {
    showTooltip(
      `
      <div class="board-tooltip__header">
        <div>
          <p class="board-tooltip__eyebrow">Uplink · ${escapeHtml(robot.id)}</p>
          <h3 class="board-tooltip__title">${escapeHtml(robot.name)}</h3>
          <p class="board-tooltip__subtitle">${escapeHtml(robot.archetype)}</p>
        </div>
        <span class="board-tooltip__battery">${robot.battery}%</span>
      </div>
      <dl class="board-tooltip__stats">
        <div>
          <dt>Signal</dt>
          <dd>${escapeHtml(robot.signal)}</dd>
        </div>
        <div>
          <dt>Grid</dt>
          <dd>${robot.position.x}, ${robot.position.y}</dd>
        </div>
        <div class="board-tooltip__stat board-tooltip__stat--full">
          <dt>Location</dt>
          <dd>${escapeHtml(robot.locationLabel)}</dd>
        </div>
        <div class="board-tooltip__stat board-tooltip__stat--full">
          <dt>Tile</dt>
          <dd>${escapeHtml(tileDetailLabel(tile))}</dd>
        </div>
      </dl>
    `,
      centerX,
      centerY,
      hotspot,
    )
  }

  const showTileTooltip = (
    tile: BoardTileSummary,
    centerX: number,
    centerY: number,
    hotspot: HTMLButtonElement,
  ): void => {
    showTooltip(
      `
      <div class="board-tooltip__header">
        <div>
          <p class="board-tooltip__eyebrow">Tile intel · ${tile.position.x}, ${tile.position.y}</p>
          <h3 class="board-tooltip__title">${escapeHtml(tile.label)}</h3>
          <p class="board-tooltip__subtitle">${escapeHtml(tileKindLabel(tile.kind))}</p>
        </div>
        <span class="board-tooltip__status">${escapeHtml(tileVisibilityLabel(tile))}</span>
      </div>
      <dl class="board-tooltip__stats">
        <div>
          <dt>Access</dt>
          <dd>${escapeHtml(tileAccessLabel(tile))}</dd>
        </div>
        <div>
          <dt>Grid</dt>
          <dd>${tile.position.x}, ${tile.position.y}</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>${escapeHtml(tileKindLabel(tile.kind))}</dd>
        </div>
        <div class="board-tooltip__stat board-tooltip__stat--full">
          <dt>Tactical note</dt>
          <dd>${escapeHtml(tileTacticalNote(tile))}</dd>
        </div>
      </dl>
    `,
      centerX,
      centerY,
      hotspot,
    )
  }

  const hideTooltip = (hotspot: HTMLButtonElement): void => {
    if (activeHotspot !== hotspot) {
      return
    }

    if (document.activeElement === hotspot || hotspot.matches(':hover')) {
      return
    }

    clearTooltip()
  }

  const scheduleHideTooltip = (hotspot: HTMLButtonElement): void => {
    requestAnimationFrame(() => {
      hideTooltip(hotspot)
    })
  }

  wrapper.addEventListener('pointerleave', () => {
    if (activeHotspot !== null && document.activeElement !== activeHotspot) {
      clearTooltip()
    }
  })

  for (const tile of board.tiles) {
    const centerX = originX + tile.position.x * tileSize + tileSize / 2
    const centerY = originY + tile.position.y * tileSize + tileSize / 2

    const hotspot = document.createElement('button')
    hotspot.type = 'button'
    hotspot.className = 'board-tile-hotspot'
    hotspot.style.left = `${Math.round(centerX)}px`
    hotspot.style.top = `${Math.round(centerY)}px`
    hotspot.style.width = `${tileSizeInner}px`
    hotspot.style.height = `${tileSizeInner}px`
    if (selectedTileKey === positionKey(tile.position.x, tile.position.y)) {
      hotspot.dataset.selected = 'true'
    }
    hotspot.setAttribute(
      'aria-label',
      `${tile.label}, ${tileKindLabel(tile.kind)}, ${tileVisibilityLabel(tile).toLowerCase()}, grid ${tile.position.x}, ${tile.position.y}`,
    )

    hotspot.addEventListener('pointerenter', () => {
      showTileTooltip(tile, centerX, centerY, hotspot)
    })
    hotspot.addEventListener('focus', () => {
      showTileTooltip(tile, centerX, centerY, hotspot)
    })
    hotspot.addEventListener('pointerleave', () => {
      scheduleHideTooltip(hotspot)
    })
    hotspot.addEventListener('blur', () => {
      scheduleHideTooltip(hotspot)
    })
    hotspot.addEventListener('click', () => {
      interaction?.onSelectTile?.(tile)
    })

    tileLayer.appendChild(hotspot)
  }

  for (const robot of robots) {
    const centerX = originX + robot.position.x * tileSize + tileSize / 2
    const centerY = originY + robot.position.y * tileSize + tileSize / 2
    const radius = Math.max(13, Math.floor(tileSize * 0.23))
    const color = archetypeColor(robot.archetype)

    const glow = new Graphics()
    glow.circle(centerX, centerY, radius + 8).fill({
      alpha: 0.16,
      color,
    })
    stage.addChild(glow)

    const markerShadow = new Graphics()
    markerShadow.circle(centerX + 1, centerY + 2, radius + 1).fill({
      alpha: 0.42,
      color: 0x020617,
    })
    stage.addChild(markerShadow)

    const marker = new Graphics()
    marker
      .circle(centerX, centerY, radius)
      .fill({
        alpha: 1,
        color,
      })
      .stroke({
        alpha: 0.9,
        color: 0xe0f2fe,
        width: 2,
      })
    stage.addChild(marker)

    const highlight = new Graphics()
    highlight.circle(centerX - radius * 0.3, centerY - radius * 0.3, Math.max(3, radius * 0.18)).fill({
      alpha: 0.22,
      color: 0xffffff,
    })
    stage.addChild(highlight)

    const label = new Text({
      text: robot.name[0] ?? '?',
      style: {
        fill: '#08131f',
        fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
        fontSize: Math.max(14, Math.floor(tileSize * 0.28)),
        fontWeight: '700',
      },
    })
    label.x = Math.round(centerX - label.width / 2)
    label.y = Math.round(centerY - label.height / 2)
    stage.addChild(label)

    const hotspot = document.createElement('button')
    hotspot.type = 'button'
    hotspot.className = 'board-robot-hotspot'
    hotspot.style.left = `${Math.round(centerX)}px`
    hotspot.style.top = `${Math.round(centerY)}px`
    hotspot.style.width = `${Math.max(40, radius * 2 + 16)}px`
    hotspot.style.height = `${Math.max(40, radius * 2 + 16)}px`
    if (interaction?.activeRobotId === robot.id) {
      hotspot.dataset.operator = 'true'
    }
    if (selectedRobotId === robot.id) {
      hotspot.dataset.selected = 'true'
    }
    hotspot.setAttribute('aria-label', `${robot.name}, ${robot.archetype}, battery ${robot.battery}%`)

    const tile = tileLookup.get(positionKey(robot.position.x, robot.position.y))

    hotspot.addEventListener('pointerenter', () => {
      showRobotTooltip(robot, tile, centerX, centerY, hotspot)
    })
    hotspot.addEventListener('focus', () => {
      showRobotTooltip(robot, tile, centerX, centerY, hotspot)
    })
    hotspot.addEventListener('pointerleave', () => {
      scheduleHideTooltip(hotspot)
    })
    hotspot.addEventListener('blur', () => {
      scheduleHideTooltip(hotspot)
    })
    hotspot.addEventListener('click', () => {
      interaction?.onSelectRobot?.(robot)
    })

    robotLayer.appendChild(hotspot)
  }

  return app
}
