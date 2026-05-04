import type { AppBootstrap } from '../app/types'

interface LayoutHandle {
  readonly autosaveButton: HTMLButtonElement
  readonly boardHost: HTMLDivElement
  readonly packetButtons: NodeListOf<HTMLButtonElement>
  readonly packetStatus: HTMLParagraphElement
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const robotMarkup = (robot: AppBootstrap['robots'][number]): string => `
  <article class="robot-card">
    <div class="robot-card__header">
      <div>
        <h3>${escapeHtml(robot.name)}</h3>
        <p>${escapeHtml(robot.archetype)}</p>
      </div>
      <span class="robot-card__battery">${robot.battery}%</span>
    </div>
    <dl class="robot-card__stats">
      <div>
        <dt>Position</dt>
        <dd>${robot.position.x + 1}, ${robot.position.y + 1}</dd>
      </div>
      <div>
        <dt>Signal</dt>
        <dd>${escapeHtml(robot.signal)}</dd>
      </div>
      <div>
        <dt>Location</dt>
        <dd>${escapeHtml(robot.locationLabel)}</dd>
      </div>
    </dl>
  </article>
`

const packetMarkup = (packet: AppBootstrap['packets'][number]): string => `
  <button class="packet-button" data-packet-id="${escapeHtml(packet.id)}" type="button">
    Copy ${escapeHtml(packet.label)}
  </button>
`

export const renderLayout = (
  container: HTMLElement,
  bootstrap: AppBootstrap,
): LayoutHandle => {
  container.innerHTML = `
    <div class="shell">
      <header class="shell__header">
        <div>
          <p class="eyebrow">Sigil deterministic preview</p>
          <h1>${escapeHtml(bootstrap.title)}</h1>
          <p class="tagline">${escapeHtml(bootstrap.tagline)}</p>
        </div>
        <dl class="mission-meters">
          <div>
            <dt>Mission clock</dt>
            <dd>${escapeHtml(bootstrap.mission.missionClock)}</dd>
          </div>
          <div>
            <dt>Alarm</dt>
            <dd>${escapeHtml(bootstrap.mission.alarmLevel)}</dd>
          </div>
          <div>
            <dt>Trace</dt>
            <dd>${bootstrap.mission.trace}%</dd>
          </div>
        </dl>
      </header>

      <main class="shell__content">
        <section class="board-panel panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Tactical board</p>
              <h2>${escapeHtml(bootstrap.mission.corporation)} cold-storage lab</h2>
            </div>
            <p class="panel__summary">${escapeHtml(bootstrap.mission.objective)}</p>
          </div>
          <div class="board-host" data-board-host></div>
        </section>

        <aside class="sidebar">
          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Robot roster</p>
                <h2>Operators online</h2>
              </div>
            </div>
            <div class="robot-list">
              ${bootstrap.robots.map((robot) => robotMarkup(robot)).join('')}
            </div>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Export payloads</p>
                <h2>Manual AI handoff</h2>
              </div>
            </div>
            <div class="packet-list">
              ${bootstrap.packets.map((packet) => packetMarkup(packet)).join('')}
              <button class="packet-button" data-copy-autosave type="button">
                Copy autosave payload
              </button>
            </div>
            <p class="packet-meta">
              Browser bootstrap writes one canonical autosave (${bootstrap.autosave.length} chars) to
              localStorage on load.
            </p>
            <p class="packet-status" data-packet-status>
              Copying packets is free; mission time should only advance on world actions.
            </p>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Bootstrap goals</p>
                <h2>Next wiring steps</h2>
              </div>
            </div>
            <ol class="next-steps">
              ${bootstrap.nextSteps
                .map((step) => `<li>${escapeHtml(step)}</li>`)
                .join('')}
            </ol>
          </section>
        </aside>
      </main>
    </div>
  `

  const boardHost = container.querySelector<HTMLDivElement>('[data-board-host]')
  const autosaveButton =
    container.querySelector<HTMLButtonElement>('[data-copy-autosave]')
  const packetStatus =
    container.querySelector<HTMLParagraphElement>('[data-packet-status]')

  if (autosaveButton === null || boardHost === null || packetStatus === null) {
    throw new Error('Failed to render the Remote Ops shell layout.')
  }

  return {
    autosaveButton,
    boardHost,
    packetButtons: container.querySelectorAll<HTMLButtonElement>('[data-packet-id]'),
    packetStatus,
  }
}
