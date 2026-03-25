import { useEffect, useState } from 'react'
import CircuitEditor from './features/circuit-editor/components/CircuitEditor'
import { useTranslation } from 'react-i18next'
import { useCircuitStore } from './features/circuit-editor/store/circuitStore'
import { exportCircuit, type ExportCircuitResult } from './features/circuit-editor/exportCircuit'

export default function App() {
  const { t, i18n } = useTranslation()
  const doc = useCircuitStore((state) => state.doc)
  const components = useCircuitStore((state) => state.doc.components)
  const selectedComponentId = useCircuitStore((state) => state.selectedComponentId)
  const hasGround = components.some((component) => component.kind === 'ground')
  const exportState = hasGround && components.length > 0 ? 'ready' : 'draft'
  const [exportResult, setExportResult] = useState<ExportCircuitResult | null>(null)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (exportStatus === 'idle') {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setExportStatus('idle')
    }, 2400)

    return () => window.clearTimeout(timeoutId)
  }, [exportStatus])

  async function handleExport() {
    const nextExportResult = exportCircuit(doc)
    setExportResult(nextExportResult)

    try {
      await navigator.clipboard.writeText(JSON.stringify(nextExportResult.payload, null, 2))
      setExportStatus('success')
    } catch {
      setExportStatus('error')
    }
  }

  async function handleToggleLanguage() {
    const nextLanguage = i18n.resolvedLanguage === 'zh-CN' ? 'en' : 'zh-CN'
    await i18n.changeLanguage(nextLanguage)
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel">
        <div className="workspace-shell">
          <div className="workspace-head">
            <div>
              <h2 className="workspace-title">{t('app.workspace.title')}</h2>
              <p className="support-text">{t('app.workspace.description')}</p>
            </div>
            <div className="workspace-meta workspace-tools">
              <div
                className="status-chip workspace-tool"
                data-tone={exportState === 'ready' ? 'success' : 'accent'}
              >
                {exportState === 'ready'
                  ? t('app.side.ready')
                  : t('app.side.needsGround')}
              </div>
              <div className="status-chip workspace-tool" data-tone="primary">
                {selectedComponentId
                  ? t('app.side.selected', { id: selectedComponentId })
                  : t('app.side.noSelection')}
              </div>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="primary"
                onClick={() => void handleExport()}
              >
                {t('panel.export.exportJson')}
              </button>
              <button
                type="button"
                className="lang-button workspace-tool"
                onClick={() => void handleToggleLanguage()}
              >
                {i18n.resolvedLanguage === 'zh-CN'
                  ? t('app.language.en')
                  : t('app.language.zhCN')}
              </button>
              {exportResult ? (
                <>
                  <div className="status-chip workspace-tool" data-tone="success">
                    {t('panel.export.summaryGround')}:
                    {' '}
                    {exportResult.diagnostics.hasGround
                      ? t('panel.fields.booleanTrue')
                      : t('panel.fields.booleanFalse')}
                  </div>
                  <div className="status-chip workspace-tool" data-tone="primary">
                    {t('panel.export.summaryPins')}:
                    {' '}
                    {exportResult.diagnostics.unconnectedPins.length}
                  </div>
                  <div className="status-chip workspace-tool" data-tone="primary">
                    {t('panel.export.summaryConflicts')}:
                    {' '}
                    {exportResult.conflicts.length}
                  </div>
                </>
              ) : null}
              {exportStatus === 'success' ? (
                <div className="status-chip workspace-tool" data-tone="success">
                  {t('panel.export.exportSuccess')}
                </div>
              ) : null}
              {exportStatus === 'error' ? (
                <div className="status-chip workspace-tool" data-tone="accent">
                  {t('panel.export.exportError')}
                </div>
              ) : null}
            </div>
          </div>
          <CircuitEditor />
        </div>
      </section>
    </main>
  )
}
