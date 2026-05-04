import { Application, Container, Graphics, Text } from 'pixi.js'
import type { BoardSummary, RobotSummary } from '../app/types'

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

export const createBoard = async (
  host: HTMLElement,
  board: BoardSummary,
  robots: readonly RobotSummary[],
): Promise<Application> => {
  const app = new Application()
  await app.init({
    antialias: true,
    background: '#09111f',
    resizeTo: host,
  })

  host.replaceChildren(app.canvas)

  const stage = new Container()
  app.stage.addChild(stage)

  const hostWidth = Math.max(host.clientWidth, 520)
  const hostHeight = Math.max(host.clientHeight, 420)
  const padding = 28
  const tileSize = Math.min(
    56,
    Math.max(
      36,
      Math.floor(
        Math.min(
          (hostWidth - padding * 2) / board.width,
          (hostHeight - padding * 2) / board.height,
        ),
      ),
    ),
  )
  const originX = Math.floor((hostWidth - tileSize * board.width) / 2)
  const originY = Math.floor((hostHeight - tileSize * board.height) / 2)

  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const tile = new Graphics()
      tile
        .roundRect(originX + x * tileSize, originY + y * tileSize, tileSize - 4, tileSize - 4, 8)
        .fill((x + y) % 2 === 0 ? 0x101a2f : 0x13203a)
      stage.addChild(tile)
    }
  }

  for (const robot of robots) {
    const centerX = originX + robot.position.x * tileSize + (tileSize - 4) / 2
    const centerY = originY + robot.position.y * tileSize + (tileSize - 4) / 2

    const marker = new Graphics()
    marker
      .circle(centerX, centerY, Math.max(12, Math.floor(tileSize * 0.24)))
      .fill(archetypeColor(robot.archetype))
    stage.addChild(marker)

    const label = new Text({
      text: robot.name[0] ?? '?',
      style: {
        fill: '#08131f',
        fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
        fontSize: Math.max(14, Math.floor(tileSize * 0.3)),
        fontWeight: '700',
      },
    })
    label.x = centerX - Math.floor(tileSize * 0.12)
    label.y = centerY - Math.floor(tileSize * 0.2)
    stage.addChild(label)
  }

  const legend = new Text({
    text: 'SIGIL STATE · LIVE BOARD PREVIEW',
    style: {
      fill: '#7dd3fc',
      fontFamily: 'IBM Plex Mono, ui-monospace, monospace',
      fontSize: 12,
      letterSpacing: 1.5,
    },
  })
  legend.x = originX
  legend.y = Math.max(8, originY - 22)
  stage.addChild(legend)

  return app
}
