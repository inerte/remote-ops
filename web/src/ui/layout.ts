import type { AppBootstrap } from '../app/types'

interface LayoutHandle {
  readonly acknowledgeButton: HTMLButtonElement
  readonly actionStatus: HTMLParagraphElement
  readonly advanceButton: HTMLButtonElement
  readonly autosaveButton: HTMLButtonElement
  readonly boardHost: HTMLDivElement
  readonly packetButtons: NodeListOf<HTMLButtonElement>
  readonly packetStatus: HTMLParagraphElement
  readonly resetButton: HTMLButtonElement
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const actionButtonMarkup = (
  label: string,
  attribute: string,
  disabled: boolean,
): string => `
  <button class="action-button" ${attribute} type="button"${disabled ? ' disabled' : ''}>
    ${escapeHtml(label)}
  </button>
`

const eventMarkup = (entry: AppBootstrap['eventLog'][number]): string => `
  <li class="event-entry">
    <span class="event-entry__turn">Turn ${entry.turn}</span>
    <p>${escapeHtml(entry.message)}</p>
  </li>
`

const interruptMarkup = (interrupt: string): string => `
  <li class="interrupt-entry">${escapeHtml(interrupt)}</li>
`

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
          <p class="eyebrow">Sigil deterministic shell</p>
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
          <div>
            <dt>Objective</dt>
            <dd>${escapeHtml(bootstrap.mission.objectiveStatus)}</dd>
          </div>
          <div>
            <dt>Mission</dt>
            <dd>${escapeHtml(bootstrap.mission.missionStatus)}</dd>
          </div>
          <div>
            <dt>Queued orders</dt>
            <dd>${bootstrap.mission.queuedOrders}</dd>
          </div>
        </dl>
      </header>

      <main class="shell__content">
        <section class="board-panel panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">Tactical board</p>
              <h2>
                ${escapeHtml(bootstrap.mission.corporation)}
                ${escapeHtml(bootstrap.mission.siteLabel)}
              </h2>
            </div>
            <p class="panel__summary">${escapeHtml(bootstrap.mission.objective)}</p>
          </div>
          <div class="board-host" data-board-host></div>
          <dl class="board-summary">
            <div>
              <dt>Turn</dt>
              <dd>${bootstrap.mission.turn}</dd>
            </div>
            <div>
              <dt>Exposure</dt>
              <dd>${bootstrap.mission.exposure}</dd>
            </div>
            <div>
              <dt>Interrupts</dt>
              <dd>${bootstrap.mission.pendingInterrupts}</dd>
            </div>
          </dl>
        </section>

        <aside class="sidebar">
          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Command uplink</p>
                <h2>Mission controls</h2>
              </div>
            </div>
            <div class="control-actions">
              ${actionButtonMarkup(
                'Advance to next interrupt',
                'data-advance-shell',
                bootstrap.controls.canAdvance === false,
              )}
              ${actionButtonMarkup(
                'Acknowledge interrupts',
                'data-acknowledge-shell',
                bootstrap.controls.canAcknowledge === false,
              )}
              ${actionButtonMarkup(
                'Reset mission',
                'data-reset-shell',
                bootstrap.controls.canReset === false,
              )}
            </div>
            <p class="action-status" data-action-status>
              ${escapeHtml(bootstrap.controls.status)}
            </p>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Interrupt queue</p>
                <h2>Current blockers</h2>
              </div>
            </div>
            <div class="panel__body">
              ${
                bootstrap.interrupts.length === 0
                  ? '<p class="empty-state">No interrupts are blocking the queue.</p>'
                  : `<ul class="interrupt-list">${bootstrap.interrupts
                      .map((interrupt) => interruptMarkup(interrupt))
                      .join('')}</ul>`
              }
            </div>
          </section>

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
              Canonical autosave payload (${bootstrap.autosave.length} chars) is refreshed from
              deterministic Sigil state after every world action.
            </p>
            <p class="packet-status" data-packet-status>
              Copying packets is free; world state stays deterministic.
            </p>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Recent event log</p>
                <h2>Mission feed</h2>
              </div>
            </div>
            <div class="panel__body">
              <ol class="event-list">
                ${[...bootstrap.eventLog]
                  .reverse()
                  .map((entry) => eventMarkup(entry))
                  .join('')}
              </ol>
            </div>
          </section>
        </aside>
      </main>
    </div>
  `

  const acknowledgeButton =
    container.querySelector<HTMLButtonElement>('[data-acknowledge-shell]')
  const actionStatus = container.querySelector<HTMLParagraphElement>('[data-action-status]')
  const advanceButton = container.querySelector<HTMLButtonElement>('[data-advance-shell]')
  const autosaveButton = container.querySelector<HTMLButtonElement>('[data-copy-autosave]')
  const boardHost = container.querySelector<HTMLDivElement>('[data-board-host]')
  const packetStatus = container.querySelector<HTMLParagraphElement>('[data-packet-status]')
  const resetButton = container.querySelector<HTMLButtonElement>('[data-reset-shell]')

  if (
    acknowledgeButton === null ||
    actionStatus === null ||
    advanceButton === null ||
    autosaveButton === null ||
    boardHost === null ||
    packetStatus === null ||
    resetButton === null
  ) {
    throw new Error('Failed to render the Remote Ops shell layout.')
  }

  return {
    acknowledgeButton,
    actionStatus,
    advanceButton,
    autosaveButton,
    boardHost,
    packetButtons: container.querySelectorAll<HTMLButtonElement>('[data-packet-id]'),
    packetStatus,
    resetButton,
  }
}
