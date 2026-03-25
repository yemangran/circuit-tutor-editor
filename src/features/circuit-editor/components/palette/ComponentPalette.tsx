import type { DragEvent } from 'react'
import { componentTemplates } from '../../componentTemplates'
import { useCircuitStore } from '../../store/circuitStore'
import { useTranslation } from 'react-i18next'

const PALETTE_MIME_TYPE = 'application/x-circuit-component'

function getComponentHint(kind: keyof typeof componentTemplates) {
  switch (kind) {
    case 'resistor':
      return 'R'
    case 'conductance':
      return 'S'
    case 'capacitor':
      return 'F'
    case 'inductor':
      return 'H'
    case 'voltage_source':
      return 'V'
    case 'current_source':
      return 'A'
    case 'controlled_voltage_source':
      return 'CV'
    case 'controlled_current_source':
      return 'CA'
    case 'generic_load':
      return 'W'
    case 'switch_spst':
      return 'SPST'
    case 'switch_spdt':
      return 'SPDT'
    case 'junction':
      return 'NODE'
    case 'ground':
      return 'GND'
  }
}

export function ComponentPalette() {
  const addComponent = useCircuitStore((state) => state.addComponent)
  const { t } = useTranslation()
  const templates = Object.values(componentTemplates)

  function handleDragStart(
    event: DragEvent<HTMLButtonElement>,
    kind: keyof typeof componentTemplates,
  ) {
    event.dataTransfer.setData(PALETTE_MIME_TYPE, kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="studio-card palette-panel">
      <div className="panel-header">
        <h2 className="panel-title">{t('palette.title')}</h2>
        <p className="panel-subtitle">{t('palette.subtitle')}</p>
      </div>

      <div className="palette-grid palette-grid-compact">
        {templates.map((template) => (
          <button
            key={template.kind}
            type="button"
            className="palette-button palette-tile"
            draggable
            onClick={() => addComponent(template.kind)}
            onDragStart={(event) => handleDragStart(event, template.kind)}
            title={t(`palette.components.${template.kind}`)}
          >
            <div className="palette-tile-hint">{getComponentHint(template.kind)}</div>
            <div className="palette-button-title palette-tile-title">
              {t(`palette.components.${template.kind}`)}
            </div>
          </button>
        ))}
      </div>

      <div className="palette-footer">
        <a
          href="https://github.com/yemangran/circuit-tutor-editor"
          target="_blank"
          rel="noopener noreferrer"
          className="palette-repo-link"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          GitHub
        </a>
      </div>
    </aside>
  )
}
