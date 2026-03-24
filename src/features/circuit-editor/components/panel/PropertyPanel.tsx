import { useState } from 'react'
import { exportCircuit, type ExportCircuitResult } from '../../exportCircuit'
import { resolveNodes } from '../../resolveNodes'
import { useCircuitStore } from '../../store/circuitStore'
import type { ControlRelation, ParameterValue } from '../../types/circuit'
import { makePinKey } from '../../unionFind'
import { useTranslation } from 'react-i18next'

const panelStyle = {
  width: 320,
  padding: 16,
  border: '1px solid #d6d3d1',
  borderRadius: 16,
  background: '#fffdf8',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 16,
  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)',
}

const sectionStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 10,
}

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
}

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
}

const pinRowStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 6,
  padding: 10,
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  background: '#ffffff',
}

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
}

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: '#334155',
}

const metaStyle = {
  fontSize: 12,
  color: '#64748b',
}

const headingStyle = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  color: '#0f172a',
}

const emptyStateStyle = {
  fontSize: 13,
  color: '#64748b',
  lineHeight: 1.5,
}

const buttonRowStyle = {
  display: 'flex',
  gap: 8,
}

const buttonStyle = {
  padding: '9px 12px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  background: '#ffffff',
  color: '#0f172a',
  fontWeight: 600,
  cursor: 'pointer',
}

const secondaryButtonStyle = {
  ...buttonStyle,
  background: '#f8fafc',
}

const preStyle = {
  margin: 0,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  background: '#0f172a',
  color: '#e2e8f0',
  fontSize: 12,
  lineHeight: 1.5,
  maxHeight: 260,
  overflow: 'auto' as const,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
}

const summaryListStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 4,
  fontSize: 12,
  color: '#475569',
}

function getMagnitudeValue(parameter: ParameterValue): string {
  if (parameter.magnitude == null) {
    return ''
  }

  return `${parameter.magnitude}`
}

function isControlledSource(kind: string) {
  return kind === 'controlled_voltage_source' || kind === 'controlled_current_source'
}

function isVoltageControlled(mode: ControlRelation['mode']) {
  return mode === 'VCVS' || mode === 'VCCS'
}

export function PropertyPanel() {
  const { t } = useTranslation()
  const doc = useCircuitStore((state) => state.doc)
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId)
  const updateComponentLabel = useCircuitStore((state) => state.updateComponentLabel)
  const updateComponentParameter = useCircuitStore((state) => state.updateComponentParameter)
  const updateComponentState = useCircuitStore((state) => state.updateComponentState)
  const setNamedNode = useCircuitStore((state) => state.setNamedNode)
  const removeNamedNode = useCircuitStore((state) => state.removeNamedNode)
  const upsertControlRelation = useCircuitStore((state) => state.upsertControlRelation)
  const removeControlRelation = useCircuitStore((state) => state.removeControlRelation)
  const [exportResult, setExportResult] = useState<ExportCircuitResult | null>(null)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const selectedComponent = doc.components.find(
    (component) => component.id === selectedComponentId,
  )

  const resolved = resolveNodes({
    components: doc.components,
    wires: doc.wires,
    namedNodes: doc.namedNodes,
  })

  if (!selectedComponent) {
    return (
      <aside style={panelStyle}>
        <div style={sectionStyle}>
          <h2 style={headingStyle}>{t('panel.properties.title')}</h2>
          <div style={emptyStateStyle}>
            {t('panel.properties.empty')}
          </div>
        </div>
      </aside>
    )
  }

  const namedNodeMap = Object.fromEntries(
    doc.namedNodes.map((namedNode) => [namedNode.id, namedNode.label]),
  )
  const controlRelation =
    selectedComponent &&
    doc.controlRelations.find(
      (relation) => relation.targetComponentId === selectedComponent.id,
    )
  const exportText = exportResult ? JSON.stringify(exportResult.payload, null, 2) : ''

  function handleExport() {
    setExportResult(exportCircuit(doc))
    setCopyStatus('idle')
  }

  async function handleCopy() {
    if (!exportText) {
      return
    }

    try {
      await navigator.clipboard.writeText(exportText)
      setCopyStatus('success')
    } catch {
      setCopyStatus('error')
    }
  }

  return (
    <aside style={{ ...panelStyle, overflowY: 'auto' }}>
      <div style={sectionStyle}>
        <h2 style={headingStyle}>{t('panel.properties.title')}</h2>
        <div style={metaStyle}>
          {t('panel.properties.componentMeta', {
            component: t(`palette.components.${selectedComponent.kind}`),
            id: selectedComponent.id,
          })}
        </div>
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>{t('panel.fields.label')}</div>
        <input
          style={inputStyle}
          value={selectedComponent.label}
          onChange={(event) =>
            updateComponentLabel(selectedComponent.id, event.target.value)
          }
        />
      </div>

      <div style={sectionStyle}>
        <div style={labelStyle}>{t('panel.fields.parameters')}</div>
        {Object.entries(selectedComponent.parameters).length === 0 ? (
          <div style={metaStyle}>{t('panel.fields.noEditableParameters')}</div>
        ) : (
          Object.entries(selectedComponent.parameters).map(([key, parameter]) => (
            <div key={key} style={pinRowStyle}>
              <div style={labelStyle}>
                {t(`panel.parameterNames.${key}`, { defaultValue: key })}
              </div>
              <div style={rowStyle}>
                <div style={fieldStyle}>
                  <div style={metaStyle}>{t('panel.fields.magnitude')}</div>
                  <input
                    style={inputStyle}
                    type="number"
                    value={getMagnitudeValue(parameter)}
                    onChange={(event) =>
                      updateComponentParameter(selectedComponent.id, key, {
                        magnitude:
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                      })
                    }
                  />
                </div>
                <div style={fieldStyle}>
                  <div style={metaStyle}>{t('panel.fields.unit')}</div>
                  <input
                    style={inputStyle}
                    value={parameter.unit ?? ''}
                    onChange={(event) =>
                      updateComponentParameter(selectedComponent.id, key, {
                        unit: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <label style={{ ...metaStyle, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={Boolean(parameter.isUnknown)}
                  onChange={(event) =>
                    updateComponentParameter(selectedComponent.id, key, {
                      isUnknown: event.target.checked,
                    })
                  }
                />
                {t('panel.fields.unknown')}
              </label>
            </div>
          ))
        )}
      </div>

      {(selectedComponent.kind === 'switch_spst' ||
        selectedComponent.kind === 'switch_spdt') && (
        <div style={sectionStyle}>
          <div style={labelStyle}>{t('panel.fields.switchState')}</div>
          <select
            style={inputStyle}
            value={selectedComponent.metadata?.state ?? ''}
            onChange={(event) =>
              updateComponentState(selectedComponent.id, event.target.value)
            }
          >
            {selectedComponent.kind === 'switch_spst' ? (
              <>
                <option value="open">{t('panel.switch.open')}</option>
                <option value="closed">{t('panel.switch.closed')}</option>
              </>
            ) : (
              <>
                <option value="A">A</option>
                <option value="B">B</option>
              </>
            )}
          </select>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={labelStyle}>{t('panel.fields.nodeLabels')}</div>
        {selectedComponent.pins.map((pinId) => {
          const pinKey = makePinKey(selectedComponent.id, pinId)
          const nodeLabel = resolved.pinToNode[pinKey] ?? ''
          const namedLabel = namedNodeMap[pinKey] ?? ''

          return (
            <div key={pinKey} style={pinRowStyle}>
              <div style={labelStyle}>{pinId}</div>
              <div style={metaStyle}>
                {t('panel.fields.currentNode', {
                  label: nodeLabel || t('panel.fields.unresolved'),
                })}
              </div>
              <input
                style={inputStyle}
                value={namedLabel}
                placeholder={t('panel.fields.nodeLabelPlaceholder')}
                onChange={(event) => {
                  const nextLabel = event.target.value
                  if (nextLabel.trim() === '') {
                    removeNamedNode(pinKey)
                    return
                  }

                  setNamedNode(pinKey, nextLabel)
                }}
              />
            </div>
          )
        })}
      </div>

      {isControlledSource(selectedComponent.kind) && (
        <div style={sectionStyle}>
          <div style={labelStyle}>{t('panel.control.title')}</div>
          <select
            style={inputStyle}
            value={controlRelation?.mode ?? ''}
            onChange={(event) => {
              const mode = event.target.value as ControlRelation['mode']
              const controlType = isVoltageControlled(mode) ? 'voltage' : 'current'
              const control = isVoltageControlled(mode)
                ? { positiveNode: '', negativeNode: '' }
                : { branch: '' }

              upsertControlRelation(selectedComponent.id, {
                mode,
                controlType,
                control,
              })
            }}
          >
            <option value="">{t('panel.control.selectMode')}</option>
            <option value="VCVS">VCVS</option>
            <option value="VCCS">VCCS</option>
            <option value="CCVS">CCVS</option>
            <option value="CCCS">CCCS</option>
          </select>

          {controlRelation ? (
            <>
              <div style={rowStyle}>
                <div style={fieldStyle}>
                  <div style={metaStyle}>{t('panel.control.gain')}</div>
                  <input
                    style={inputStyle}
                    type="number"
                    value={getMagnitudeValue(controlRelation.gain)}
                    onChange={(event) =>
                      upsertControlRelation(selectedComponent.id, {
                        gain: {
                          ...controlRelation.gain,
                          magnitude:
                            event.target.value === ''
                              ? null
                              : Number(event.target.value),
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldStyle}>
                  <div style={metaStyle}>{t('panel.control.gainUnit')}</div>
                  <input
                    style={inputStyle}
                    value={controlRelation.gain.unit ?? ''}
                    onChange={(event) =>
                      upsertControlRelation(selectedComponent.id, {
                        gain: {
                          ...controlRelation.gain,
                          unit: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>

              {isVoltageControlled(controlRelation.mode) ? (
                <div style={rowStyle}>
                  <div style={fieldStyle}>
                    <div style={metaStyle}>{t('panel.control.positiveNode')}</div>
                    <input
                      style={inputStyle}
                      value={String(controlRelation.control.positiveNode ?? '')}
                      onChange={(event) =>
                        upsertControlRelation(selectedComponent.id, {
                          control: {
                            positiveNode: event.target.value,
                            negativeNode: String(
                              controlRelation.control.negativeNode ?? '',
                            ),
                          },
                        })
                      }
                    />
                  </div>
                  <div style={fieldStyle}>
                    <div style={metaStyle}>{t('panel.control.negativeNode')}</div>
                    <input
                      style={inputStyle}
                      value={String(controlRelation.control.negativeNode ?? '')}
                      onChange={(event) =>
                        upsertControlRelation(selectedComponent.id, {
                          control: {
                            positiveNode: String(
                              controlRelation.control.positiveNode ?? '',
                            ),
                            negativeNode: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              ) : (
                <div style={fieldStyle}>
                  <div style={metaStyle}>{t('panel.control.branch')}</div>
                  <input
                    style={inputStyle}
                    value={String(controlRelation.control.branch ?? '')}
                    onChange={(event) =>
                      upsertControlRelation(selectedComponent.id, {
                        control: {
                          branch: event.target.value,
                        },
                      })
                    }
                  />
                </div>
              )}

              <button
                type="button"
                style={secondaryButtonStyle}
                onClick={() => removeControlRelation(selectedComponent.id)}
              >
                {t('panel.control.remove')}
              </button>
            </>
          ) : (
            <div style={metaStyle}>{t('panel.control.empty')}</div>
          )}
        </div>
      )}

      <div style={sectionStyle}>
        <div style={labelStyle}>{t('panel.export.title')}</div>
        <div style={buttonRowStyle}>
          <button type="button" style={buttonStyle} onClick={handleExport}>
            {t('panel.export.exportJson')}
          </button>
          <button
            type="button"
            style={{
              ...secondaryButtonStyle,
              opacity: exportText ? 1 : 0.5,
              cursor: exportText ? 'pointer' : 'not-allowed',
            }}
            disabled={!exportText}
            onClick={handleCopy}
          >
            {t('panel.export.copyJson')}
          </button>
        </div>
        {copyStatus === 'success' ? (
          <div style={metaStyle}>{t('panel.export.copySuccess')}</div>
        ) : null}
        {copyStatus === 'error' ? (
          <div style={metaStyle}>{t('panel.export.copyError')}</div>
        ) : null}
        {exportResult ? (
          <>
            <div style={summaryListStyle}>
              <div>
                {t('panel.export.hasGround', {
                  value: exportResult.diagnostics.hasGround
                    ? t('panel.fields.booleanTrue')
                    : t('panel.fields.booleanFalse'),
                })}
              </div>
              <div>
                {t('panel.export.unconnectedPins', {
                  count: exportResult.diagnostics.unconnectedPins.length,
                })}
              </div>
              <div>
                {t('panel.export.namedNodeConflicts', {
                  count: exportResult.diagnostics.namedNodeConflicts.length,
                })}
              </div>
              <div>
                {t('panel.export.conflicts', {
                  count: exportResult.conflicts.length,
                })}
              </div>
            </div>
            <pre style={preStyle}>{exportText}</pre>
          </>
        ) : (
          <div style={emptyStateStyle}>{t('panel.export.previewEmpty')}</div>
        )}
      </div>
    </aside>
  )
}
