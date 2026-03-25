import { useCircuitStore } from "../../store/circuitStore";
import { useTranslation } from "react-i18next";

export function CanvasFoot() {
  const { t } = useTranslation();
  const components = useCircuitStore((state) => state.doc.components);
  const clearCanvas = useCircuitStore((state) => state.clearCanvas);

  function handleClearCanvas() {
    if (window.confirm(t("editor.canvas.clearCanvasConfirm"))) {
      clearCanvas();
    }
  }

  return (
    <div className="canvas-foot">
      <div className="canvas-legend">
        <div className="mini-chip">{t("editor.canvas.legend.drag")}</div>
        <div className="mini-chip">{t("editor.canvas.legend.connect")}</div>
        <div className="mini-chip">{t("editor.canvas.legend.inspect")}</div>
      </div>
      <button
        type="button"
        className="toolbar-button canvas-foot-action"
        onClick={handleClearCanvas}
        disabled={components.length === 0}
      >
        {t("editor.canvas.clearCanvas")}
      </button>
    </div>
  );
}
