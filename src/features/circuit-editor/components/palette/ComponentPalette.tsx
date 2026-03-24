import { componentTemplates } from '../../componentTemplates'
import { useCircuitStore } from '../../store/circuitStore'
import { useTranslation } from 'react-i18next'

const paletteStyle = {
  width: 260,
  padding: 16,
  border: '1px solid #d6d3d1',
  borderRadius: 16,
  background: '#fffdf8',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 10,
}

const buttonStyle = {
  width: '100%',
  textAlign: 'left' as const,
  border: '1px solid #d6d3d1',
  borderRadius: 12,
  background: '#ffffff',
  padding: '10px 12px',
  cursor: 'pointer',
}

const titleStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: '#0f172a',
}

const subtitleStyle = {
  margin: 0,
  fontSize: 12,
  color: '#64748b',
  lineHeight: 1.4,
}

const buttonTitleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: '#0f172a',
}

const buttonMetaStyle = {
  marginTop: 4,
  fontSize: 11,
  color: '#475569',
}

export function ComponentPalette() {
  const addComponent = useCircuitStore((state) => state.addComponent)
  const { t } = useTranslation()

  return (
    <aside style={paletteStyle}>
      <div>
        <h2 style={titleStyle}>{t('palette.title')}</h2>
        <p style={subtitleStyle}>{t('palette.subtitle')}</p>
      </div>
      <div style={gridStyle}>
        {Object.values(componentTemplates).map((template) => (
          <button
            key={template.kind}
            type="button"
            style={buttonStyle}
            onClick={() => addComponent(template.kind)}
          >
            <div style={buttonTitleStyle}>{t(`palette.components.${template.kind}`)}</div>
            <div style={buttonMetaStyle}>
              {t('palette.componentMeta', {
                prefix: template.labelPrefix,
                pins: template.pins.join(', '),
              })}
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
