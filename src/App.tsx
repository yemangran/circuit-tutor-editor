import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CircuitEditor from "./features/circuit-editor/components/CircuitEditor";
import {
  exportAsciiDebugReport,
  exportAsciiDiagram,
} from "./features/circuit-editor/exportAscii";
import {
  exportCircuit,
  formatExportPayloadForLLM,
  type ExportCircuitResult,
} from "./features/circuit-editor/exportCircuit";
import { useCircuitStore } from "./features/circuit-editor/store/circuitStore";
import {
  AIAnalysisDialog,
  type AIAnalysisResult,
} from "./features/ai-analysis/components/AIAnalysisDialog";
import { AISettingsDialog } from "./features/ai-analysis/components/AISettingsDialog";
import { captureCircuitDiagram } from "./features/ai-analysis/captureCircuitDiagram";
import { analyzeCircuitDiagram } from "./features/ai-analysis/analyzeCircuitDiagram";
import { useAISettingsStore } from "./features/ai-analysis/store/aiSettingsStore";

type ExportKind = "json" | "ascii";

export default function App() {
  const { t, i18n } = useTranslation();
  const doc = useCircuitStore((state) => state.doc);
  const components = useCircuitStore((state) => state.doc.components);
  const selectedComponentId = useCircuitStore(
    (state) => state.selectedComponentId,
  );
  const hasGround = components.some((component) => component.kind === "ground");
  const [exportResult, setExportResult] = useState<ExportCircuitResult | null>(
    null,
  );
  const [exportStatus, setExportStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isAIAnalysisOpen, setIsAIAnalysisOpen] = useState(false);
  const [aiStatus, setAIStatus] = useState<
    "idle" | "running" | "success" | "error"
  >("idle");
  const [aiCopyStatus, setAICopyStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [aiErrorMessage, setAIErrorMessage] = useState<string | null>(null);
  const [aiResult, setAIResult] = useState<AIAnalysisResult | null>(null);
  const aiBaseURL = useAISettingsStore((state) => state.baseURL);
  const aiModel = useAISettingsStore((state) => state.model);
  const aiPrompt = useAISettingsStore((state) => state.prompt);
  const aiApiKey = useAISettingsStore((state) => state.apiKey);
  const isAIConfigured = Boolean(
    aiBaseURL.trim() && aiModel.trim() && aiApiKey.trim(),
  );

  useEffect(() => {
    if (exportStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setExportStatus("idle");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [exportStatus]);

  useEffect(() => {
    if (aiStatus === "idle" || aiStatus === "running") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAIStatus("idle");
    }, 2800);

    return () => window.clearTimeout(timeoutId);
  }, [aiStatus]);

  useEffect(() => {
    if (aiCopyStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAICopyStatus("idle");
    }, 2400);

    return () => window.clearTimeout(timeoutId);
  }, [aiCopyStatus]);

  function buildExportContent(
    kind: ExportKind,
    nextExportResult: ExportCircuitResult,
  ): { content: string; debug?: string } {
    if (kind === "ascii") {
      return {
        content: exportAsciiDiagram(nextExportResult.payload),
        debug: exportAsciiDebugReport(nextExportResult.payload),
      };
    }

    return {
      content: formatExportPayloadForLLM(nextExportResult.payload),
    };
  }

  async function handleExport(kind: ExportKind) {
    const nextExportResult = exportCircuit(doc);
    const result = buildExportContent(kind, nextExportResult);

    setExportResult(nextExportResult);

    if (kind === "ascii" && result.debug) {
      console.groupCollapsed("[ASCII Export Debug]");
      console.log(result.debug);
      console.groupEnd();
    }

    try {
      await navigator.clipboard.writeText(result.content);
      setExportStatus("success");
    } catch {
      setExportStatus("error");
    }
  }

  async function handleToggleLanguage() {
    const nextLanguage = i18n.resolvedLanguage === "zh-CN" ? "en" : "zh-CN";
    await i18n.changeLanguage(nextLanguage);
  }

  async function handleCopyAIResult() {
    if (!aiResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(aiResult.content);
      setAICopyStatus("success");
    } catch {
      setAICopyStatus("error");
    }
  }

  async function handleAnalyzeCircuitDiagram() {
    if (!isAIConfigured) {
      setIsAISettingsOpen(true);
      setAIStatus("error");
      setAIErrorMessage(t("ai.analysis.missingConfig"));
      return;
    }

    setIsAIAnalysisOpen(true);
    setAIStatus("running");
    setAICopyStatus("idle");
    setAIErrorMessage(null);
    setAIResult(null);

    try {
      const capture = await captureCircuitDiagram();
      const content = await analyzeCircuitDiagram({
        apiKey: aiApiKey,
        baseURL: aiBaseURL,
        model: aiModel,
        prompt: aiPrompt,
        title: doc.meta.title,
        imageDataUrl: capture.dataUrl,
      });

      setAIResult({
        content,
        imageDataUrl: capture.dataUrl,
        model: aiModel,
      });
      setAIStatus("success");
    } catch (error) {
      setAIResult(null);
      setAIStatus("error");
      setAIErrorMessage(
        error instanceof Error ? error.message : t("ai.analysis.genericError"),
      );
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel">
        <div className="workspace-shell">
          <div className="workspace-head">
            <div>
              <h2 className="workspace-title">{t("app.workspace.title")}</h2>
              <p className="support-text">{t("app.workspace.description")}</p>
            </div>
            <div className="workspace-meta workspace-tools">
              <div className="status-chip workspace-tool" data-tone="primary">
                {selectedComponentId
                  ? t("app.side.selected", { id: selectedComponentId })
                  : t("app.side.noSelection")}
              </div>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="primary"
                onClick={() => void handleExport("json")}
              >
                {t("panel.export.exportJson")}
              </button>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="secondary"
                onClick={() => void handleExport("ascii")}
              >
                {t("panel.export.exportAscii")}
              </button>
              <button
                type="button"
                className="lang-button workspace-tool"
                onClick={() => void handleToggleLanguage()}
              >
                {i18n.resolvedLanguage === "zh-CN"
                  ? t("app.language.en")
                  : t("app.language.zhCN")}
              </button>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="secondary"
                onClick={() => setIsAISettingsOpen(true)}
              >
                {t("ai.settings.trigger")}
              </button>
              <button
                type="button"
                className="panel-action workspace-tool"
                data-tone="primary"
                onClick={() => void handleAnalyzeCircuitDiagram()}
                disabled={aiStatus === "running"}
              >
                {aiStatus === "running"
                  ? t("ai.analysis.running")
                  : t("ai.analysis.trigger")}
              </button>
              {exportResult ? (
                <>
                  <div
                    className="status-chip workspace-tool"
                    data-tone="success"
                  >
                    {t("panel.export.summaryGround")}:{" "}
                    {exportResult.diagnostics.hasGround
                      ? t("panel.fields.booleanTrue")
                      : t("panel.fields.booleanFalse")}
                  </div>
                  <div
                    className="status-chip workspace-tool"
                    data-tone="primary"
                  >
                    {t("panel.export.summaryPins")}:{" "}
                    {exportResult.diagnostics.unconnectedPins.length}
                  </div>
                  <div
                    className="status-chip workspace-tool"
                    data-tone="primary"
                  >
                    {t("panel.export.summaryConflicts")}:{" "}
                    {exportResult.conflicts.length}
                  </div>
                </>
              ) : null}
              {exportStatus === "success" ? (
                <div className="status-chip workspace-tool" data-tone="success">
                  {t("panel.export.exportSuccess")}
                </div>
              ) : null}
              {exportStatus === "error" ? (
                <div className="status-chip workspace-tool" data-tone="accent">
                  {t("panel.export.exportError")}
                </div>
              ) : null}
              {!isAIConfigured ? (
                <div className="status-chip workspace-tool" data-tone="accent">
                  {t("ai.status.notConfigured")}
                </div>
              ) : null}
              {aiStatus === "success" ? (
                <div className="status-chip workspace-tool" data-tone="success">
                  {t("ai.status.success")}
                </div>
              ) : null}
              {aiStatus === "error" && !isAIAnalysisOpen ? (
                <div className="status-chip workspace-tool" data-tone="accent">
                  {t("ai.status.error")}
                </div>
              ) : null}
              {aiCopyStatus === "success" ? (
                <div className="status-chip workspace-tool" data-tone="success">
                  {t("ai.analysis.copySuccess")}
                </div>
              ) : null}
              {aiCopyStatus === "error" ? (
                <div className="status-chip workspace-tool" data-tone="accent">
                  {t("ai.analysis.copyError")}
                </div>
              ) : null}
            </div>
          </div>
          <div className="workspace-editor">
            <CircuitEditor />
          </div>
        </div>
      </section>
      <AISettingsDialog
        open={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />
      <AIAnalysisDialog
        open={isAIAnalysisOpen}
        result={aiResult}
        errorMessage={aiErrorMessage}
        isLoading={aiStatus === "running"}
        onClose={() => setIsAIAnalysisOpen(false)}
        onCopy={() => void handleCopyAIResult()}
      />
    </main>
  );
}
