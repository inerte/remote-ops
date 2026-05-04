import {
  ORDER_OPTIONS,
  orderTypeDescription,
  orderTypeNeedsPosition,
  orderTypeNeedsTargetRobot,
  type BrowserOrderDraft,
} from '../app/orders'
import type {
  BoardActionDescriptor,
  BoardInspectorModel,
  BoardInspectorStat,
} from '../app/boardInspector'
import type { AppBootstrap } from '../app/types'

interface LayoutHandle {
  readonly acknowledgeButton: HTMLButtonElement
  readonly autosaveField: HTMLTextAreaElement
  readonly actionStatus: HTMLParagraphElement
  readonly advanceButton: HTMLButtonElement
  readonly autosaveButton: HTMLButtonElement
  readonly boardActionButtons: NodeListOf<HTMLButtonElement>
  readonly boardHost: HTMLDivElement
  readonly configButtons: NodeListOf<HTMLButtonElement>
  readonly contractButtons: NodeListOf<HTMLButtonElement>
  readonly launchMissionButton: HTMLButtonElement
  readonly openConfigButton: HTMLButtonElement
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
  readonly returnToConfigButton: HTMLButtonElement
  readonly returnToLobbyButton: HTMLButtonElement
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
  hidden = false,
  variant: 'primary' | 'secondary' = 'primary',
): string => `
  <button class="action-button${variant === 'secondary' ? ' action-button--secondary' : ''}" ${attribute} type="button"${disabled ? ' disabled' : ''}${hidden ? ' hidden' : ''}>
    ${escapeHtml(label)}
  </button>
`

const debriefEventMarkup = (message: string): string => `
  <li class="debrief-event">${escapeHtml(message)}</li>
`

const eventMarkup = (entry: AppBootstrap['eventLog'][number]): string => `
  <li class="event-entry">
    <span class="event-entry__turn">Turn ${entry.turn}</span>
    <p>${escapeHtml(entry.message)}</p>
  </li>
`

const findSelectedConfig = (
  bootstrap: AppBootstrap,
): AppBootstrap['shell']['configOptions'][number] | undefined =>
  bootstrap.shell.configOptions.find((option) => option.selected)

const findSelectedContract = (
  bootstrap: AppBootstrap,
): AppBootstrap['shell']['contractOptions'][number] | undefined =>
  bootstrap.shell.contractOptions.find((contract) => contract.selected)

const headerMetricMarkup = (label: string, value: string): string => `
  <div>
    <dt>${escapeHtml(label)}</dt>
    <dd>${escapeHtml(value)}</dd>
  </div>
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

const packetMarkup = (packet: AppBootstrap['packets'][number]): string => `
  <button class="packet-button" data-packet-id="${escapeHtml(packet.id)}" type="button">
    Copy ${escapeHtml(packet.label)}
  </button>
`

const boardInspectorStatMarkup = (stat: BoardInspectorStat): string => `
  <div${stat.full ? ' class="selection-card__stat--full"' : ''}>
    <dt>${escapeHtml(stat.label)}</dt>
    <dd>${escapeHtml(stat.value)}</dd>
  </div>
`

const boardInspectorActionMarkup = (action: BoardActionDescriptor): string => `
  <button
    class="action-button${action.variant === 'secondary' ? ' action-button--secondary' : ''}"
    data-board-action-kind="${escapeHtml(action.actionKind)}"
    ${action.moveX === undefined ? '' : `data-board-move-x="${escapeHtml(action.moveX)}"`}
    ${action.moveY === undefined ? '' : `data-board-move-y="${escapeHtml(action.moveY)}"`}
    ${action.orderType === undefined ? '' : `data-board-order-type="${escapeHtml(action.orderType)}"`}
    ${action.robotId === undefined ? '' : `data-board-robot-id="${escapeHtml(action.robotId)}"`}
    ${action.targetRobotId === undefined ? '' : `data-board-target-robot-id="${escapeHtml(action.targetRobotId)}"`}
    title="${escapeHtml(action.description)}"
    type="button"
    ${action.disabled ? 'disabled' : ''}
  >
    ${escapeHtml(action.label)}
  </button>
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

const robotOptionMarkup = (
  robot: AppBootstrap['robots'][number],
  selectedRobotId: string,
): string => optionMarkup(robot.id, `${robot.name} · ${robot.id}`, robot.id === selectedRobotId)

const contractOptionMarkup = (
  contract: AppBootstrap['shell']['contractOptions'][number],
): string => `
  <button
    class="selection-card"
    data-contract-id="${escapeHtml(contract.contractId)}"
    data-select-contract
    data-selected="${contract.selected ? 'true' : 'false'}"
    type="button"
  >
    <div class="selection-card__header">
      <div>
        <p class="eyebrow">Contract</p>
        <h3>${escapeHtml(contract.label)}</h3>
      </div>
      <span class="selection-pill">${escapeHtml(contract.corporation)}</span>
    </div>
    <dl class="selection-card__stats">
      <div>
        <dt>Objective</dt>
        <dd>${escapeHtml(contract.objective)}</dd>
      </div>
      <div>
        <dt>Risk</dt>
        <dd>${escapeHtml(contract.risk)}</dd>
      </div>
    </dl>
    <p class="selection-card__summary">${escapeHtml(contract.summary)}</p>
  </button>
`

const configOptionMarkup = (
  option: AppBootstrap['shell']['configOptions'][number],
): string => `
  <button
    class="selection-card"
    data-config-id="${escapeHtml(option.id)}"
    data-select-config
    data-selected="${option.selected ? 'true' : 'false'}"
    type="button"
  >
    <div class="selection-card__header">
      <div>
        <p class="eyebrow">Entry plan</p>
        <h3>${escapeHtml(option.label)}</h3>
      </div>
      <span class="selection-pill">${option.selected ? 'Selected' : 'Preview'}</span>
    </div>
    <p class="selection-card__summary">${escapeHtml(option.summary)}</p>
    <ul class="selection-card__effects">
      ${option.effects.map((effect) => `<li>${escapeHtml(effect)}</li>`).join('')}
    </ul>
  </button>
`

const summaryCardMarkup = (
  eyebrow: string,
  title: string,
  details: readonly [readonly [string, string], readonly [string, string]],
  summary: string,
): string => `
  <article class="selection-card selection-card--static" data-selected="true">
    <div class="selection-card__header">
      <div>
        <p class="eyebrow">${escapeHtml(eyebrow)}</p>
        <h3>${escapeHtml(title)}</h3>
      </div>
    </div>
    <dl class="selection-card__stats">
      <div>
        <dt>${escapeHtml(details[0][0])}</dt>
        <dd>${escapeHtml(details[0][1])}</dd>
      </div>
      <div>
        <dt>${escapeHtml(details[1][0])}</dt>
        <dd>${escapeHtml(details[1][1])}</dd>
      </div>
    </dl>
    <p class="selection-card__summary">${escapeHtml(summary)}</p>
  </article>
`

const stageStepIndex = (stage: AppBootstrap['shell']['activeStage']): number =>
  stage === 'lobby' ? 0 : stage === 'config' ? 1 : 2

const stageStepMarkup = (
  activeStage: AppBootstrap['shell']['activeStage'],
  stepStage: AppBootstrap['shell']['activeStage'],
  label: string,
  number: number,
): string => {
  const activeIndex = stageStepIndex(activeStage)
  const stepIndex = stageStepIndex(stepStage)
  const state =
    stepIndex < activeIndex ? 'complete' : stepIndex === activeIndex ? 'current' : 'upcoming'

  return `
    <li class="stage-step" data-state="${state}">
      <span class="stage-step__index">${number}</span>
      <span class="stage-step__label">${escapeHtml(label)}</span>
    </li>
  `
}

export const renderLayout = (
  container: HTMLElement,
  bootstrap: AppBootstrap,
  orderDraft: BrowserOrderDraft,
  boardInspector: BoardInspectorModel,
): LayoutHandle => {
  const missionStage = bootstrap.shell.activeStage === 'mission'
  const selectedContract = findSelectedContract(bootstrap)
  const selectedConfig = findSelectedConfig(bootstrap)
  const followTargets = bootstrap.robots.filter((robot) => robot.id !== orderDraft.robotId)

  const headerMetrics = missionStage
    ? [
        ['Mission clock', bootstrap.mission.missionClock],
        ['Alarm', bootstrap.mission.alarmLevel],
        ['Trace', `${bootstrap.mission.trace}%`],
        ['Objective', bootstrap.mission.objectiveStatus],
        ['Mission', bootstrap.mission.missionStatus],
        ['Queued orders', String(bootstrap.mission.queuedOrders)],
      ]
    : [
        ['Contract', selectedContract?.corporation ?? 'Unknown'],
        ['Objective', selectedContract?.objective ?? 'Unknown'],
        ['Entry plan', selectedConfig?.label ?? 'Pending'],
        ['Clock', bootstrap.mission.missionClock],
        ['Alarm', bootstrap.mission.alarmLevel],
        ['Trace', `${bootstrap.mission.trace}%`],
      ]

  const boardStats = missionStage
    ? [
        ['Turn', String(bootstrap.mission.turn)],
        ['Exposure', String(bootstrap.mission.exposure)],
        ['Interrupts', String(bootstrap.mission.pendingInterrupts)],
      ]
    : [
        ['Preview turn', String(bootstrap.mission.turn)],
        ['Exposure', String(bootstrap.mission.exposure)],
        ['Seeded orders', String(bootstrap.mission.queuedOrders)],
      ]

  const previewSummary = missionStage
    ? bootstrap.debrief.summary
    : bootstrap.shell.activeStage === 'lobby'
      ? selectedContract?.summary ?? bootstrap.shell.stageSummary
      : selectedConfig?.summary ?? bootstrap.shell.stageSummary

  const previewItems = missionStage
    ? bootstrap.debrief.keyEvents
    : bootstrap.shell.activeStage === 'config'
      ? (selectedConfig?.effects ?? [bootstrap.shell.stageSummary])
      : [
          selectedContract?.summary ?? 'Select a contract to inspect the deterministic operation package.',
          selectedConfig === undefined
            ? 'Open mission briefing to choose an entry plan before launch.'
            : `Default entry plan: ${selectedConfig.label}. Open the mission briefing to tune it.`,
        ]

  const flowContent =
    bootstrap.shell.activeStage === 'lobby'
      ? `
        <div class="selection-grid">
          ${bootstrap.shell.contractOptions.map((contract) => contractOptionMarkup(contract)).join('')}
        </div>
      `
      : bootstrap.shell.activeStage === 'config'
        ? `
          <p class="flow-copy">
            Contract locked: ${escapeHtml(selectedContract?.label ?? 'Unknown operation')} · ${escapeHtml(selectedContract?.corporation ?? 'Unknown corporation')}
          </p>
          <div class="selection-grid">
            ${bootstrap.shell.configOptions.map((option) => configOptionMarkup(option)).join('')}
          </div>
        `
        : `
          <p class="flow-copy">
            Mission thread is live. Step back into briefing to replay the opener, or return to the lobby to choose a different contract package.
          </p>
          <div class="selection-grid selection-grid--summary">
            ${summaryCardMarkup(
              'Selected contract',
              selectedContract?.label ?? 'Unknown operation',
              [
                ['Corporation', selectedContract?.corporation ?? 'Unknown'],
                ['Risk', selectedContract?.risk ?? 'Unrated'],
              ],
              selectedContract?.summary ?? bootstrap.shell.stageSummary,
            )}
            ${summaryCardMarkup(
              'Entry plan',
              selectedConfig?.label ?? 'Pending plan',
              [
                ['Preview clock', bootstrap.mission.missionClock],
                ['Trace', `${bootstrap.mission.trace}%`],
              ],
              selectedConfig?.summary ?? bootstrap.shell.stageSummary,
            )}
          </div>
        `

  container.innerHTML = `
    <div class="shell">
      <header class="shell__header">
        <div>
          <p class="eyebrow">Sigil deterministic shell</p>
          <h1>${escapeHtml(bootstrap.title)}</h1>
          <p class="tagline">${escapeHtml(bootstrap.tagline)}</p>
        </div>
        <dl class="mission-meters">
          ${headerMetrics.map(([label, value]) => headerMetricMarkup(label, value)).join('')}
        </dl>
      </header>

      <main class="shell__content">
        <section class="board-panel panel">
          <div class="panel__header">
            <div>
              <p class="eyebrow">${missionStage ? 'Tactical board' : 'Operation preview'}</p>
              <h2>
                ${escapeHtml(bootstrap.mission.corporation)}
                ${escapeHtml(bootstrap.mission.siteLabel)}
              </h2>
            </div>
            <p class="panel__summary">${escapeHtml(bootstrap.shell.stageSummary)}</p>
          </div>
          <div class="board-host" data-board-host></div>
          <dl class="board-summary">
            ${boardStats.map(([label, value]) => headerMetricMarkup(label, value)).join('')}
          </dl>
          ${
            missionStage
              ? `
                <div class="board-inspector">
                  <article class="selection-card selection-card--static" data-selected="true">
                    <div class="selection-card__header">
                      <div>
                        <p class="eyebrow">${escapeHtml(boardInspector.eyebrow)}</p>
                        <h3>${escapeHtml(boardInspector.title)}</h3>
                      </div>
                      <span class="selection-pill">${escapeHtml(boardInspector.badge)}</span>
                    </div>
                    <p class="selection-card__summary">${escapeHtml(boardInspector.summary)}</p>
                    <dl class="selection-card__stats">
                      ${boardInspector.stats.map((stat) => boardInspectorStatMarkup(stat)).join('')}
                    </dl>
                  </article>
                  <div class="board-inspector__actions">
                    ${boardInspector.actions
                      .map((action) => boardInspectorActionMarkup(action))
                      .join('')}
                  </div>
                  <p class="board-inspector__hint">${escapeHtml(boardInspector.hint)}</p>
                </div>
              `
              : ''
          }
        </section>

        <aside class="sidebar">
          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">Pre-mission flow</p>
                <h2>${escapeHtml(bootstrap.shell.stageTitle)}</h2>
              </div>
              <p class="panel__summary">${escapeHtml(bootstrap.shell.stageSummary)}</p>
            </div>
            <div class="flow-panel__body">
              <ol class="stage-track">
                ${stageStepMarkup(bootstrap.shell.activeStage, 'lobby', 'Contract', 1)}
                ${stageStepMarkup(bootstrap.shell.activeStage, 'config', 'Briefing', 2)}
                ${stageStepMarkup(bootstrap.shell.activeStage, 'mission', 'Mission', 3)}
              </ol>
              ${flowContent}
            </div>
            <div class="selection-actions">
              ${actionButtonMarkup(
                'Open mission briefing',
                'data-open-config',
                false,
                bootstrap.shell.activeStage !== 'lobby',
              )}
              ${actionButtonMarkup(
                'Back to contract lobby',
                'data-return-lobby',
                false,
                bootstrap.shell.activeStage === 'lobby',
                'secondary',
              )}
              ${actionButtonMarkup(
                'Launch mission shell',
                'data-launch-mission',
                false,
                bootstrap.shell.activeStage !== 'config',
              )}
              ${actionButtonMarkup(
                'Replay from mission briefing',
                'data-return-config',
                false,
                bootstrap.shell.activeStage !== 'mission',
                'secondary',
              )}
            </div>
          </section>

          <section
            class="panel panel--debrief${missionStage ? '' : ' panel--preview'}"
            data-terminal="${missionStage && bootstrap.debrief.isTerminal ? 'true' : 'false'}"
            data-tone="${escapeHtml(missionStage ? bootstrap.debrief.tone : 'info')}"
          >
            <div class="panel__header">
              <div>
                <p class="eyebrow">${missionStage ? (bootstrap.debrief.isTerminal ? 'Mission debrief' : 'Mission outlook') : 'Operation preview'}</p>
                <h2>${escapeHtml(missionStage ? bootstrap.debrief.outcome : bootstrap.shell.stageTitle)}</h2>
              </div>
              <span class="debrief-badge">${escapeHtml(missionStage ? bootstrap.mission.missionStatus : selectedConfig?.label ?? 'Contract selected')}</span>
            </div>
            <div class="debrief">
              <p class="debrief__summary">${escapeHtml(previewSummary)}</p>
              <dl class="debrief__stats">
                <div>
                  <dt>${missionStage ? 'Clock' : 'Corporation'}</dt>
                  <dd>${escapeHtml(missionStage ? bootstrap.mission.missionClock : selectedContract?.corporation ?? 'Unknown')}</dd>
                </div>
                <div>
                  <dt>${missionStage ? 'Trace' : 'Objective'}</dt>
                  <dd>${escapeHtml(missionStage ? `${bootstrap.mission.trace}%` : selectedContract?.objective ?? 'Unknown')}</dd>
                </div>
                <div>
                  <dt>${missionStage ? 'Exposure' : 'Risk'}</dt>
                  <dd>${escapeHtml(missionStage ? String(bootstrap.mission.exposure) : selectedContract?.risk ?? 'Unrated')}</dd>
                </div>
                <div>
                  <dt>${missionStage ? 'Objective' : 'Entry plan'}</dt>
                  <dd>${escapeHtml(missionStage ? bootstrap.mission.objectiveStatus : selectedConfig?.label ?? 'Pending')}</dd>
                </div>
              </dl>
              <div class="debrief__events">
                <p class="field__label">${missionStage ? 'Key events' : bootstrap.shell.activeStage === 'config' ? 'Entry plan effects' : 'Operation notes'}</p>
                ${
                  previewItems.length === 0
                    ? '<p class="empty-state">No mission events are available yet.</p>'
                    : `<ul class="debrief-event-list">${previewItems
                        .map((message) => debriefEventMarkup(message))
                        .join('')}</ul>`
                }
              </div>
              <p class="debrief__next-step">${escapeHtml(
                missionStage ? bootstrap.debrief.nextStep : bootstrap.controls.status,
              )}</p>
            </div>
          </section>

          <section class="panel">
            <div class="panel__header">
              <div>
                <p class="eyebrow">${missionStage ? 'Command uplink' : 'Shell controls'}</p>
                <h2>${missionStage ? 'Mission controls' : 'Reset and restore'}</h2>
              </div>
            </div>
            <div class="control-actions">
              ${actionButtonMarkup(
                'Advance to next interrupt',
                'data-advance-shell',
                bootstrap.controls.canAdvance === false,
                missionStage === false,
              )}
              ${actionButtonMarkup(
                'Acknowledge interrupts',
                'data-acknowledge-shell',
                bootstrap.controls.canAcknowledge === false,
                missionStage === false,
              )}
              ${actionButtonMarkup(
                'Reset shell to default lobby',
                'data-reset-shell',
                bootstrap.controls.canReset === false,
                false,
                'secondary',
              )}
            </div>
            <p class="action-status" data-action-status>
              ${escapeHtml(bootstrap.controls.status)}
            </p>
          </section>

          <section class="panel"${missionStage ? '' : ' hidden'}>
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

          <section class="panel"${missionStage ? '' : ' hidden'}>
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
                The current autosave payload is mirrored here for manual backup or paste restore.
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
                <p class="eyebrow">${missionStage ? 'Recent event log' : 'Operation log'}</p>
                <h2>${missionStage ? 'Mission feed' : 'Briefing feed'}</h2>
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
  const launchMissionButton =
    container.querySelector<HTMLButtonElement>('[data-launch-mission]')
  const openConfigButton = container.querySelector<HTMLButtonElement>('[data-open-config]')
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
  const returnToConfigButton =
    container.querySelector<HTMLButtonElement>('[data-return-config]')
  const returnToLobbyButton =
    container.querySelector<HTMLButtonElement>('[data-return-lobby]')
  const saveStatus = container.querySelector<HTMLParagraphElement>('[data-save-status]')

  if (
    acknowledgeButton === null ||
    autosaveField === null ||
    actionStatus === null ||
    advanceButton === null ||
    autosaveButton === null ||
    boardHost === null ||
    launchMissionButton === null ||
    openConfigButton === null ||
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
    returnToConfigButton === null ||
    returnToLobbyButton === null ||
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
    boardActionButtons: container.querySelectorAll<HTMLButtonElement>('[data-board-action-kind]'),
    boardHost,
    configButtons: container.querySelectorAll<HTMLButtonElement>('[data-select-config]'),
    contractButtons: container.querySelectorAll<HTMLButtonElement>('[data-select-contract]'),
    launchMissionButton,
    openConfigButton,
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
    returnToConfigButton,
    returnToLobbyButton,
    saveStatus,
  }
}
