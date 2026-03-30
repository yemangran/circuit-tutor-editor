import { ReactFlowProvider } from "reactflow";
import { useEffect, useRef, useState } from "react";
import CircuitCanvas from "./canvas/CircuitCanvas";
import { CanvasFoot } from "./canvas/CanvasFoot";
import { PropertyPanel } from "./panel/PropertyPanel";
import { ComponentPalette } from "./palette/ComponentPalette";
import { useCircuitStore } from "../store/circuitStore";
import { useTranslation } from "react-i18next";

export default function CircuitEditor() {
  const { t } = useTranslation();
  const components = useCircuitStore((state) => state.doc.components);
  const documentTitle = useCircuitStore((state) => state.doc.meta.title);
  const selectedComponentId = useCircuitStore(
    (state) => state.selectedComponentId,
  );
  const selectedWireId = useCircuitStore((state) => state.selectedWireId);
  const updateDocumentTitle = useCircuitStore(
    (state) => state.updateDocumentTitle,
  );
  const hasSelection = Boolean(selectedComponentId || selectedWireId);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(documentTitle);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setTitleDraft(documentTitle);
  }, [documentTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select();
    }
  }, [isEditingTitle]);

  function commitTitle(nextTitle: string) {
    const normalizedTitle = nextTitle.trim() || t("editor.canvas.defaultTitle");
    updateDocumentTitle(normalizedTitle);
    setTitleDraft(normalizedTitle);
    setIsEditingTitle(false);
  }

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
            <div className="canvas-head-copy">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  id="circuit-title"
                  className="canvas-title-editor"
                  value={titleDraft}
                  aria-label={t("editor.canvas.editTitle")}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  onBlur={() => commitTitle(titleDraft)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      commitTitle(titleDraft);
                    }

                    if (event.key === "Escape") {
                      setTitleDraft(documentTitle);
                      setIsEditingTitle(false);
                    }
                  }}
                />
              ) : (
                <button
                  type="button"
                  className="canvas-title-trigger"
                  onClick={() => setIsEditingTitle(true)}
                  aria-label={t("editor.canvas.editTitle")}
                  title={t("editor.canvas.editTitle")}
                >
                  <h3 className="panel-title canvas-title">{documentTitle}</h3>
                </button>
              )}
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
          <div className="canvas-body">
            <CircuitCanvas />
          </div>
          <CanvasFoot />
        </div>
        {hasSelection ? <PropertyPanel /> : null}
      </div>
    </ReactFlowProvider>
  );
}
