import {
  ORDER_OPTIONS,
  orderTypeDescription,
  orderTypeNeedsPosition,
  orderTypeNeedsTargetRobot,
  type BrowserOrderDraft,
} from '../app/orders'
import type { AppBootstrap } from '../app/types'

interface LayoutHandle {
  readonly acknowledgeButton: HTMLButtonElement
  readonly autosaveField: HTMLTextAreaElement
  readonly actionStatus: HTMLParagraphElement
  readonly advanceButton: HTMLButtonElement
  readonly autosaveButton: HTMLButtonElement
  readonly boardHost: HTMLDivElement
  readonly orderFollowField: HTMLDivElement
  readonly orderForm: HTMLFormElement
  readonly orderHint: HTMLParagraphElement
  readonly orderMoveFields: HTMLDivElement
  readonly orderMoveXField: HTMLInputElement
  readonly orderMoveYField: HTMLInputElement
  readonly orderRobotField: HTMLSelectElement
  readonly orderStatus: HTMLParagraphElement
  readonly orderSubmitButton: HTMLButtonElement
  readonly orderTargetField: HTMLSelectElement
  readonly orderTypeField: HTMLSelectElement
  readonly packetButtons: NodeListOf<HTMLButtonElement>
  readonly packetStatus: HTMLParagraphElement
  readonly resetButton: HTMLButtonElement
  readonly restoreAutosaveButton: HTMLButtonElement
  readonly saveStatus: HTMLParagraphElement
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

const optionMarkup = (value: string, label: string, selected: boolean): string => `
  <option value="${escapeHtml(value)}"${selected ? ' selected' : ''}>
    ${escapeHtml(label)}
  </option>
`

const orderOptionMarkup = (
  option: (typeof ORDER_OPTIONS)[number],
  selectedValue: BrowserOrderDraft['orderType'],
): string => optionMarkup(option.value, option.label, option.value === selectedValue)

const robotOptionMarkup = (
  robot: AppBootstrap['robots'][number],
  selectedRobotId: string,
): string => optionMarkup(robot.id, `${robot.name} · ${robot.id}`, robot.id === selectedRobotId)

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
  orderDraft: BrowserOrderDraft,
): LayoutHandle => {
  const followTargets = bootstrap.robots.filter((robot) => robot.id !== orderDraft.robotId)

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
                <p class="eyebrow">High-level orders</p>
                <h2>Queue robot action</h2>
              </div>
            </div>
            <form class="order-form" data-order-form>
              <div class="order-form__grid">
                <label class="field">
                  <span class="field__label">Robot</span>
                  <select class="field__control" data-order-robot>
                    ${bootstrap.robots
                      .map((robot) => robotOptionMarkup(robot, orderDraft.robotId))
                      .join('')}
                  </select>
                </label>
                <label class="field">
                  <span class="field__label">Order</span>
                  <select class="field__control" data-order-type>
                    ${ORDER_OPTIONS.map((option) => orderOptionMarkup(option, orderDraft.orderType)).join('')}
                  </select>
                </label>
              </div>
              <div class="field" data-order-follow-field${orderTypeNeedsTargetRobot(orderDraft.orderType) ? '' : ' hidden'}>
                <label class="field__stack">
                  <span class="field__label">Follow target</span>
                  <select class="field__control" data-order-target>
                    ${followTargets
                      .map((robot) => robotOptionMarkup(robot, orderDraft.targetRobotId))
                      .join('')}
                  </select>
                </label>
              </div>
              <div class="order-form__grid" data-order-move-fields${orderTypeNeedsPosition(orderDraft.orderType) ? '' : ' hidden'}>
                <label class="field">
                  <span class="field__label">Grid X</span>
                  <input
                    class="field__control"
                    data-order-move-x
                    inputmode="numeric"
                    max="${bootstrap.board.width - 1}"
                    min="0"
                    type="number"
                    value="${escapeHtml(orderDraft.moveX)}"
                  />
                </label>
                <label class="field">
                  <span class="field__label">Grid Y</span>
                  <input
                    class="field__control"
                    data-order-move-y
                    inputmode="numeric"
                    max="${bootstrap.board.height - 1}"
                    min="0"
                    type="number"
                    value="${escapeHtml(orderDraft.moveY)}"
                  />
                </label>
              </div>
              <p class="order-form__hint" data-order-hint>
                ${escapeHtml(orderTypeDescription(orderDraft.orderType))}
              </p>
              <p class="packet-meta">
                Move orders use the packet-grid coordinate system (0-based x,y) already used by
                the deterministic shell.
              </p>
              <div class="save-transfer__actions">
                <button
                  class="action-button"
                  data-submit-order
                  type="submit"
                  ${bootstrap.controls.canQueueOrders ? '' : 'disabled'}
                >
                  Queue selected order
                </button>
              </div>
            </form>
            <p class="action-status" data-order-status>
              Orders queued here are appended to the deterministic mission stack.
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
                <p class="eyebrow">Canonical autosave</p>
                <h2>Manual save / restore</h2>
              </div>
            </div>
            <div class="save-transfer">
              <p class="save-transfer__hint">
                The current autosave payload is mirrored here for manual backup or paste
                restore.
              </p>
              <label class="save-transfer__label" for="autosave-transfer-field">
                Current deterministic payload
              </label>
              <textarea
                class="save-transfer__editor"
                data-autosave-field
                id="autosave-transfer-field"
                rows="8"
                spellcheck="false"
              >${escapeHtml(bootstrap.autosave)}</textarea>
              <div class="save-transfer__actions">
                <button class="action-button" data-restore-autosave type="button">
                  Restore pasted autosave
                </button>
              </div>
            </div>
            <p class="packet-meta">
              Restoring a payload immediately re-syncs the canonical local autosave used by the
              browser shell.
            </p>
            <p class="packet-status" data-save-status>
              Paste a canonical autosave payload here, then restore it into the browser shell.
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
  const autosaveField = container.querySelector<HTMLTextAreaElement>('[data-autosave-field]')
  const actionStatus = container.querySelector<HTMLParagraphElement>('[data-action-status]')
  const advanceButton = container.querySelector<HTMLButtonElement>('[data-advance-shell]')
  const autosaveButton = container.querySelector<HTMLButtonElement>('[data-copy-autosave]')
  const boardHost = container.querySelector<HTMLDivElement>('[data-board-host]')
  const orderFollowField = container.querySelector<HTMLDivElement>('[data-order-follow-field]')
  const orderForm = container.querySelector<HTMLFormElement>('[data-order-form]')
  const orderHint = container.querySelector<HTMLParagraphElement>('[data-order-hint]')
  const orderMoveFields = container.querySelector<HTMLDivElement>('[data-order-move-fields]')
  const orderMoveXField = container.querySelector<HTMLInputElement>('[data-order-move-x]')
  const orderMoveYField = container.querySelector<HTMLInputElement>('[data-order-move-y]')
  const orderRobotField = container.querySelector<HTMLSelectElement>('[data-order-robot]')
  const orderStatus = container.querySelector<HTMLParagraphElement>('[data-order-status]')
  const orderSubmitButton = container.querySelector<HTMLButtonElement>('[data-submit-order]')
  const orderTargetField = container.querySelector<HTMLSelectElement>('[data-order-target]')
  const orderTypeField = container.querySelector<HTMLSelectElement>('[data-order-type]')
  const packetStatus = container.querySelector<HTMLParagraphElement>('[data-packet-status]')
  const resetButton = container.querySelector<HTMLButtonElement>('[data-reset-shell]')
  const restoreAutosaveButton =
    container.querySelector<HTMLButtonElement>('[data-restore-autosave]')
  const saveStatus = container.querySelector<HTMLParagraphElement>('[data-save-status]')

  if (
    acknowledgeButton === null ||
    autosaveField === null ||
    actionStatus === null ||
    advanceButton === null ||
    autosaveButton === null ||
    boardHost === null ||
    orderFollowField === null ||
    orderForm === null ||
    orderHint === null ||
    orderMoveFields === null ||
    orderMoveXField === null ||
    orderMoveYField === null ||
    orderRobotField === null ||
    orderStatus === null ||
    orderSubmitButton === null ||
    orderTargetField === null ||
    orderTypeField === null ||
    packetStatus === null ||
    resetButton === null ||
    restoreAutosaveButton === null ||
    saveStatus === null
  ) {
    throw new Error('Failed to render the Remote Ops shell layout.')
  }

  return {
    acknowledgeButton,
    autosaveField,
    actionStatus,
    advanceButton,
    autosaveButton,
    boardHost,
    orderFollowField,
    orderForm,
    orderHint,
    orderMoveFields,
    orderMoveXField,
    orderMoveYField,
    orderRobotField,
    orderStatus,
    orderSubmitButton,
    orderTargetField,
    orderTypeField,
    packetButtons: container.querySelectorAll<HTMLButtonElement>('[data-packet-id]'),
    packetStatus,
    resetButton,
    restoreAutosaveButton,
    saveStatus,
  }
}
