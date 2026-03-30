import { useTranslation } from "react-i18next";

export type AIAnalysisResult = {
  content: string;
  imageDataUrl: string;
  model: string;
};

type AIAnalysisDialogProps = {
  open: boolean;
  result: AIAnalysisResult | null;
  errorMessage: string | null;
  isLoading: boolean;
  onClose: () => void;
  onCopy: () => void;
};

export function AIAnalysisDialog({
  open,
  result,
  errorMessage,
  isLoading,
  onClose,
  onCopy,
}: AIAnalysisDialogProps) {
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="studio-card dialog-card dialog-card-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-analysis-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h2 id="ai-analysis-title" className="panel-title">
              {t("ai.analysis.title")}
            </h2>
            <p className="panel-subtitle">{t("ai.analysis.subtitle")}</p>
          </div>
          <div className="panel-actions-row">
            {result ? (
              <button
                type="button"
                className="panel-action"
                data-tone="secondary"
                onClick={onCopy}
              >
                {t("ai.analysis.copy")}
              </button>
            ) : null}
            <button
              type="button"
              className="panel-action"
              data-tone="secondary"
              onClick={onClose}
            >
              {t("ai.common.close")}
            </button>
          </div>
        </div>

        <div className="ai-analysis-layout">
          <section className="panel-section">
            <div className="section-stack">
              <h3 className="section-title">{t("ai.analysis.preview")}</h3>
              {result?.imageDataUrl ? (
                <img
                  className="analysis-preview-image"
                  src={result.imageDataUrl}
                  alt={t("ai.analysis.previewAlt")}
                />
              ) : (
                <div className="empty-state">
                  <p className="support-text">{t("ai.analysis.noPreview")}</p>
                </div>
              )}
            </div>
          </section>

          <section className="panel-section">
            <div className="section-stack">
              <div className="meta-row">
                <h3 className="section-title">{t("ai.analysis.result")}</h3>
                {result?.model ? (
                  <div className="mini-chip">{result.model}</div>
                ) : null}
              </div>

              {isLoading ? (
                <div className="empty-state">
                  <p className="support-text">{t("ai.analysis.loading")}</p>
                </div>
              ) : null}

              {!isLoading && errorMessage ? (
                <div className="empty-state" data-tone="danger">
                  <div className="field-label">{t("ai.analysis.errorTitle")}</div>
                  <p className="support-text">{errorMessage}</p>
                </div>
              ) : null}

              {!isLoading && !errorMessage && result ? (
                <pre className="code-block analysis-output">{result.content}</pre>
              ) : null}

              {!isLoading && !errorMessage && !result ? (
                <div className="empty-state">
                  <p className="support-text">{t("ai.analysis.empty")}</p>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
