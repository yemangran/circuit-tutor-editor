import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CircuitEditor from './features/circuit-editor/components/CircuitEditor'
import {
  exportAsciiDebugReport,
  exportAsciiDiagram,
} from './features/circuit-editor/exportAscii'
import {
  exportCircuit,
  formatExportPayloadForLLM,
  type ExportCircuitResult,
} from './features/circuit-editor/exportCircuit'
import { useCircuitStore } from './features/circuit-editor/store/circuitStore'

type ExportKind = 'json' | 'ascii'

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

  function buildExportContent(
    kind: ExportKind,
    nextExportResult: ExportCircuitResult,
  ): { content: string; debug?: string } {
    if (kind === 'ascii') {
      return {
        content: exportAsciiDiagram(nextExportResult.payload),
        debug: exportAsciiDebugReport(nextExportResult.payload),
      }
    }

    return {
      content: formatExportPayloadForLLM(nextExportResult.payload),
    }
  }

  async function handleExport(kind: ExportKind) {
    const nextExportResult = exportCircuit(doc)
    const result = buildExportContent(kind, nextExportResult)

    setExportResult(nextExportResult)

    if (kind === 'ascii' && result.debug) {
      console.groupCollapsed('[ASCII Export Debug]')
      console.log(result.debug)
      console.groupEnd()
    }

    try {
      await navigator.clipboard.writeText(result.content)
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
                onClick={() => void handleExport('json')}
              >
                {t('panel.export.exportJson')}
              </button>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="secondary"
                onClick={() => void handleExport('ascii')}
              >
                {t('panel.export.exportAscii')}
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
          <div className="workspace-editor">
            <CircuitEditor />
          </div>
        </div>
      </section>
    </main>
  )
}
