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
    </aside>
  )
}
