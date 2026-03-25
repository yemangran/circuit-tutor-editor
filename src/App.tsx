import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import CircuitEditor from './features/circuit-editor/components/CircuitEditor'
import { exportAsciiDiagram } from './features/circuit-editor/exportAscii'
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
  const [exportPreview, setExportPreview] = useState<{
    kind: ExportKind
    content: string
  } | null>(null)

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
  ): string {
    if (kind === 'ascii') {
      return exportAsciiDiagram(nextExportResult.payload)
    }

    return formatExportPayloadForLLM(nextExportResult.payload)
  }

  async function handleExport(kind: ExportKind) {
    const nextExportResult = exportCircuit(doc)
    const content = buildExportContent(kind, nextExportResult)

    setExportResult(nextExportResult)
    setExportPreview({ kind, content })

    try {
      await navigator.clipboard.writeText(content)
      setExportStatus('success')
    } catch {
      setExportStatus('error')
    }
  }

  async function handleCopyPreview() {
    if (!exportPreview) {
      return
    }

    try {
      await navigator.clipboard.writeText(exportPreview.content)
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
          {exportPreview ? (
            <section className="panel-section">
              <div className="meta-row">
                <div>
                  <div className="field-label">
                    {exportPreview.kind === 'ascii'
                      ? t('panel.export.previewAscii')
                      : t('panel.export.previewJson')}
                  </div>
                  <p className="support-text">
                    {exportPreview.kind === 'ascii'
                      ? t('panel.export.previewAsciiHint')
                      : t('panel.export.previewJsonHint')}
                  </p>
                </div>
                <div className="panel-actions-row">
                  <button
                    type="button"
                    className="panel-action"
                    onClick={() => void handleCopyPreview()}
                  >
                    {t('panel.export.copyCurrent')}
                  </button>
                </div>
              </div>
              <textarea
                className="export-preview-textarea"
                value={exportPreview.content}
                readOnly
              />
            </section>
          ) : null}
          <div className="workspace-editor">
            <CircuitEditor />
          </div>
        </div>
      </section>
    </main>
  )
}
