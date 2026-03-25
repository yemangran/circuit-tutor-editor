import { ReactFlowProvider } from "reactflow";
import CircuitCanvas from "./canvas/CircuitCanvas";
import { PropertyPanel } from "./panel/PropertyPanel";
import { ComponentPalette } from "./palette/ComponentPalette";
import { useCircuitStore } from "../store/circuitStore";
import { useTranslation } from "react-i18next";

export default function CircuitEditor() {
  const { t } = useTranslation();
  const components = useCircuitStore((state) => state.doc.components);
  const selectedComponentId = useCircuitStore(
    (state) => state.selectedComponentId,
  );
  const selectedWireId = useCircuitStore((state) => state.selectedWireId);
  const hasSelection = Boolean(selectedComponentId || selectedWireId);

  return (
    <ReactFlowProvider>
      <div
        className="studio-layout"
        style={{
          gridTemplateColumns: hasSelection
            ? "240px minmax(0, 1fr) 340px"
            : "240px minmax(0, 1fr)",
        }}
      >
        <ComponentPalette />
        <div className="studio-card canvas-shell">
          <div className="canvas-head">
            <div>
              <h3 className="panel-title">{t("editor.canvas.title")}</h3>
              <p className="panel-subtitle">{t("editor.canvas.subtitle")}</p>
            </div>
            <div className="workspace-meta">
              <div className="mini-chip">
                {t("editor.canvas.count", { count: components.length })}
              </div>
              <div className="mini-chip">
                {selectedComponentId
                  ? t("editor.canvas.selected", { id: selectedComponentId })
                  : selectedWireId
                    ? t("editor.canvas.selectedWire", { id: selectedWireId })
                    : t("editor.canvas.noneSelected")}
              </div>
            </div>
          </div>
          <CircuitCanvas />
        </div>
        {hasSelection ? <PropertyPanel /> : null}
      </div>
    </ReactFlowProvider>
  );
}
