import { useTranslation } from "react-i18next";
import {
  DEFAULT_CIRCUIT_ANALYSIS_PROMPT,
  useAISettingsStore,
} from "../store/aiSettingsStore";

type AISettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function AISettingsDialog({
  open,
  onClose,
}: AISettingsDialogProps) {
  const { t } = useTranslation();
  const baseURL = useAISettingsStore((state) => state.baseURL);
  const model = useAISettingsStore((state) => state.model);
  const prompt = useAISettingsStore((state) => state.prompt);
  const apiKey = useAISettingsStore((state) => state.apiKey);
  const setBaseURL = useAISettingsStore((state) => state.setBaseURL);
  const setModel = useAISettingsStore((state) => state.setModel);
  const setPrompt = useAISettingsStore((state) => state.setPrompt);
  const resetPrompt = useAISettingsStore((state) => state.resetPrompt);
  const setApiKey = useAISettingsStore((state) => state.setApiKey);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="studio-card dialog-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-settings-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <h2 id="ai-settings-title" className="panel-title">
              {t("ai.settings.title")}
            </h2>
            <p className="panel-subtitle">{t("ai.settings.subtitle")}</p>
          </div>
          <button
            type="button"
            className="panel-action"
            data-tone="secondary"
            onClick={onClose}
          >
            {t("ai.common.close")}
          </button>
        </div>

        <div className="panel-stack">
          <section className="panel-section">
            <div className="section-stack">
              <div className="pill-card">
                <div className="field-label">{t("ai.settings.securityTitle")}</div>
                <p className="support-text">{t("ai.settings.securityBody")}</p>
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="ai-base-url">
                  {t("ai.settings.baseURL")}
                </label>
                <input
                  id="ai-base-url"
                  className="text-input"
                  value={baseURL}
                  placeholder={t("ai.settings.baseURLPlaceholder")}
                  onChange={(event) => setBaseURL(event.target.value)}
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="ai-model">
                  {t("ai.settings.model")}
                </label>
                <input
                  id="ai-model"
                  className="text-input"
                  value={model}
                  placeholder={t("ai.settings.modelPlaceholder")}
                  onChange={(event) => setModel(event.target.value)}
                />
              </div>

              <div className="field-stack">
                <label className="field-label" htmlFor="ai-api-key">
                  {t("ai.settings.apiKey")}
                </label>
                <input
                  id="ai-api-key"
                  className="text-input"
                  type="password"
                  value={apiKey}
                  placeholder={t("ai.settings.apiKeyPlaceholder")}
                  onChange={(event) => setApiKey(event.target.value)}
                />
                <p className="field-hint">{t("ai.settings.apiKeyHint")}</p>
              </div>
            </div>
          </section>

          <section className="panel-section">
            <div className="section-stack">
              <div className="meta-row">
                <h3 className="section-title">{t("ai.settings.prompt")}</h3>
                <button
                  type="button"
                  className="panel-action"
                  data-tone="secondary"
                  onClick={resetPrompt}
                  disabled={prompt === DEFAULT_CIRCUIT_ANALYSIS_PROMPT}
                >
                  {t("ai.settings.resetPrompt")}
                </button>
              </div>
              <textarea
                id="ai-prompt"
                className="text-input textarea-input"
                value={prompt}
                placeholder={t("ai.settings.promptPlaceholder")}
                onChange={(event) => setPrompt(event.target.value)}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
