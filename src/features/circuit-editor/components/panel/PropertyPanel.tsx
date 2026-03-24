import { resolveNodes } from "../../resolveNodes";
import { useCircuitStore } from "../../store/circuitStore";
import type { ControlRelation, ParameterValue } from "../../types/circuit";
import { makePinKey } from "../../unionFind";
import { useTranslation } from "react-i18next";

function getMagnitudeValue(parameter: ParameterValue): string {
  if (parameter.magnitude == null) {
    return "";
  }

  return `${parameter.magnitude}`;
}

function isControlledSource(kind: string) {
  return (
    kind === "controlled_voltage_source" || kind === "controlled_current_source"
  );
}

function isVoltageControlled(mode: ControlRelation["mode"]) {
  return mode === "VCVS" || mode === "VCCS";
}

export function PropertyPanel() {
  const { t } = useTranslation();
  const doc = useCircuitStore((state) => state.doc);
  const selectedComponentId = useCircuitStore(
    (state) => state.selectedComponentId,
  );
  const updateComponentLabel = useCircuitStore(
    (state) => state.updateComponentLabel,
  );
  const updateComponentParameter = useCircuitStore(
    (state) => state.updateComponentParameter,
  );
  const updateComponentState = useCircuitStore(
    (state) => state.updateComponentState,
  );
  const setNamedNode = useCircuitStore((state) => state.setNamedNode);
  const removeNamedNode = useCircuitStore((state) => state.removeNamedNode);
  const upsertControlRelation = useCircuitStore(
    (state) => state.upsertControlRelation,
  );
  const removeControlRelation = useCircuitStore(
    (state) => state.removeControlRelation,
  );

  const selectedComponent = doc.components.find(
    (component) => component.id === selectedComponentId,
  );

  const resolved = resolveNodes({
    components: doc.components,
    wires: doc.wires,
    namedNodes: doc.namedNodes,
  });

  if (!selectedComponent) {
    return (
      <aside className="studio-card">
        <div className="panel-header">
          <h2 className="panel-title">{t("panel.properties.title")}</h2>
          <p className="panel-subtitle">{t("panel.properties.subtitle")}</p>
        </div>
        <div className="empty-state">
          <div className="field-label">{t("panel.properties.emptyTitle")}</div>
          <p className="support-text">{t("panel.properties.empty")}</p>
        </div>
      </aside>
    );
  }

  const namedNodeMap = Object.fromEntries(
    doc.namedNodes.map((namedNode) => [namedNode.id, namedNode.label]),
  );
  const controlRelation =
    selectedComponent &&
    doc.controlRelations.find(
      (relation) => relation.targetComponentId === selectedComponent.id,
    );
  const sectionIdBase = selectedComponent.id;

  return (
    <aside
      className="studio-card inspector-panel"
      style={{ overflowY: "auto" }}
    >
      <div className="panel-header">
        <h2 className="panel-title">{t("panel.properties.title")}</h2>
        <p className="panel-subtitle">
          {t("panel.properties.componentMeta", {
            component: t(`palette.components.${selectedComponent.kind}`),
            id: selectedComponent.id,
          })}
        </p>
      </div>

      <div className="panel-stack">
        <section className="panel-section">
          <div className="section-stack">
            <div className="pill-card">
              <div className="field-label">
                {t("panel.properties.selectedTitle")}
              </div>
              <p className="support-text">
                {t("panel.properties.selectedBody", {
                  id: selectedComponent.id,
                  component: t(`palette.components.${selectedComponent.kind}`),
                })}
              </p>
            </div>

            <div className="field-stack">
              <label className="field-label" htmlFor={`${sectionIdBase}-label`}>
                {t("panel.fields.label")}
              </label>
              <input
                id={`${sectionIdBase}-label`}
                className="text-input"
                value={selectedComponent.label}
                onChange={(event) =>
                  updateComponentLabel(selectedComponent.id, event.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="panel-section">
          <div className="section-stack">
            <h3 className="section-title">{t("panel.fields.parameters")}</h3>
            {Object.entries(selectedComponent.parameters).length === 0 ? (
              <p className="field-hint">
                {t("panel.fields.noEditableParameters")}
              </p>
            ) : (
              <div className="section-stack">
                {Object.entries(selectedComponent.parameters).map(
                  ([key, parameter]) => (
                    <div key={key} className="pill-card">
                      <div className="field-label">
                        {t(`panel.parameterNames.${key}`, {
                          defaultValue: key,
                        })}
                      </div>
                      <div className="field-row" style={{ marginTop: 12 }}>
                        <div className="field-stack">
                          <label
                            className="field-hint"
                            htmlFor={`${sectionIdBase}-${key}-magnitude`}
                          >
                            {t("panel.fields.magnitude")}
                          </label>
                          <input
                            id={`${sectionIdBase}-${key}-magnitude`}
                            className="text-input"
                            type="number"
                            value={getMagnitudeValue(parameter)}
                            onChange={(event) =>
                              updateComponentParameter(
                                selectedComponent.id,
                                key,
                                {
                                  magnitude:
                                    event.target.value === ""
                                      ? null
                                      : Number(event.target.value),
                                },
                              )
                            }
                          />
                        </div>
                        <div className="field-stack">
                          <label
                            className="field-hint"
                            htmlFor={`${sectionIdBase}-${key}-unit`}
                          >
                            {t("panel.fields.unit")}
                          </label>
                          <input
                            id={`${sectionIdBase}-${key}-unit`}
                            className="text-input"
                            value={parameter.unit ?? ""}
                            onChange={(event) =>
                              updateComponentParameter(
                                selectedComponent.id,
                                key,
                                {
                                  unit: event.target.value,
                                },
                              )
                            }
                          />
                        </div>
                      </div>
                      <label className="checkbox-row" style={{ marginTop: 12 }}>
                        <input
                          type="checkbox"
                          checked={Boolean(parameter.isUnknown)}
                          onChange={(event) =>
                            updateComponentParameter(
                              selectedComponent.id,
                              key,
                              {
                                isUnknown: event.target.checked,
                              },
                            )
                          }
                        />
                        {t("panel.fields.unknown")}
                      </label>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        </section>

        {(selectedComponent.kind === "switch_spst" ||
          selectedComponent.kind === "switch_spdt") && (
          <section className="panel-section">
            <div className="section-stack">
              <h3 className="section-title">{t("panel.fields.switchState")}</h3>
              <label
                className="field-label"
                htmlFor={`${sectionIdBase}-switch-state`}
              >
                {t("panel.fields.switchState")}
              </label>
              <select
                id={`${sectionIdBase}-switch-state`}
                className="select-input"
                value={selectedComponent.metadata?.state ?? ""}
                onChange={(event) =>
                  updateComponentState(selectedComponent.id, event.target.value)
                }
              >
                {selectedComponent.kind === "switch_spst" ? (
                  <>
                    <option value="open">{t("panel.switch.open")}</option>
                    <option value="closed">{t("panel.switch.closed")}</option>
                  </>
                ) : (
                  <>
                    <option value="A">A</option>
                    <option value="B">B</option>
                  </>
                )}
              </select>
            </div>
          </section>
        )}

        <section className="panel-section">
          <div className="section-stack">
            <h3 className="section-title">{t("panel.fields.nodeLabels")}</h3>
            {selectedComponent.pins.map((pinId) => {
              const pinKey = makePinKey(selectedComponent.id, pinId);
              const nodeLabel = resolved.pinToNode[pinKey] ?? "";
              const namedLabel = namedNodeMap[pinKey] ?? "";

              return (
                <div key={pinKey} className="pill-card">
                  <div className="meta-row">
                    <div className="field-label">{pinId}</div>
                    <div className="palette-prefix">
                      {nodeLabel || t("panel.fields.unresolved")}
                    </div>
                  </div>
                  <p className="field-hint" style={{ marginTop: 10 }}>
                    {t("panel.fields.currentNode", {
                      label: nodeLabel || t("panel.fields.unresolved"),
                    })}
                  </p>
                  <label
                    className="field-hint"
                    htmlFor={`${sectionIdBase}-${pinId}-node-label`}
                    style={{ display: "block", marginTop: 10 }}
                  >
                    {t("panel.fields.nodeLabelPlaceholder")}
                  </label>
                  <input
                    id={`${sectionIdBase}-${pinId}-node-label`}
                    className="text-input"
                    value={namedLabel}
                    placeholder={t("panel.fields.nodeLabelPlaceholder")}
                    onChange={(event) => {
                      const nextLabel = event.target.value;
                      if (nextLabel.trim() === "") {
                        removeNamedNode(pinKey);
                        return;
                      }

                      setNamedNode(pinKey, nextLabel);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {isControlledSource(selectedComponent.kind) && (
          <section className="panel-section">
            <div className="section-stack">
              <h3 className="section-title">{t("panel.control.title")}</h3>
              <label
                className="field-label"
                htmlFor={`${sectionIdBase}-control-mode`}
              >
                {t("panel.control.mode")}
              </label>
              <select
                id={`${sectionIdBase}-control-mode`}
                className="select-input"
                value={controlRelation?.mode ?? ""}
                onChange={(event) => {
                  const mode = event.target.value as ControlRelation["mode"];
                  const controlType = isVoltageControlled(mode)
                    ? "voltage"
                    : "current";
                  const control = isVoltageControlled(mode)
                    ? { positiveNode: "", negativeNode: "" }
                    : { branch: "" };

                  upsertControlRelation(selectedComponent.id, {
                    mode,
                    controlType,
                    control,
                  });
                }}
              >
                <option value="">{t("panel.control.selectMode")}</option>
                <option value="VCVS">VCVS</option>
                <option value="VCCS">VCCS</option>
                <option value="CCVS">CCVS</option>
                <option value="CCCS">CCCS</option>
              </select>

              {controlRelation ? (
                <>
                  <div className="field-row">
                    <div className="field-stack">
                      <label
                        className="field-hint"
                        htmlFor={`${sectionIdBase}-control-gain`}
                      >
                        {t("panel.control.gain")}
                      </label>
                      <input
                        id={`${sectionIdBase}-control-gain`}
                        className="text-input"
                        type="number"
                        value={getMagnitudeValue(controlRelation.gain)}
                        onChange={(event) =>
                          upsertControlRelation(selectedComponent.id, {
                            gain: {
                              ...controlRelation.gain,
                              magnitude:
                                event.target.value === ""
                                  ? null
                                  : Number(event.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="field-stack">
                      <label
                        className="field-hint"
                        htmlFor={`${sectionIdBase}-control-gain-unit`}
                      >
                        {t("panel.control.gainUnit")}
                      </label>
                      <input
                        id={`${sectionIdBase}-control-gain-unit`}
                        className="text-input"
                        value={controlRelation.gain.unit ?? ""}
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
                    <div className="field-row">
                      <div className="field-stack">
                        <label
                          className="field-hint"
                          htmlFor={`${sectionIdBase}-control-positive`}
                        >
                          {t("panel.control.positiveNode")}
                        </label>
                        <input
                          id={`${sectionIdBase}-control-positive`}
                          className="text-input"
                          value={String(
                            controlRelation.control.positiveNode ?? "",
                          )}
                          onChange={(event) =>
                            upsertControlRelation(selectedComponent.id, {
                              control: {
                                positiveNode: event.target.value,
                                negativeNode: String(
                                  controlRelation.control.negativeNode ?? "",
                                ),
                              },
                            })
                          }
                        />
                      </div>
                      <div className="field-stack">
                        <label
                          className="field-hint"
                          htmlFor={`${sectionIdBase}-control-negative`}
                        >
                          {t("panel.control.negativeNode")}
                        </label>
                        <input
                          id={`${sectionIdBase}-control-negative`}
                          className="text-input"
                          value={String(
                            controlRelation.control.negativeNode ?? "",
                          )}
                          onChange={(event) =>
                            upsertControlRelation(selectedComponent.id, {
                              control: {
                                positiveNode: String(
                                  controlRelation.control.positiveNode ?? "",
                                ),
                                negativeNode: event.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="field-stack">
                      <label
                        className="field-hint"
                        htmlFor={`${sectionIdBase}-control-branch`}
                      >
                        {t("panel.control.branch")}
                      </label>
                      <input
                        id={`${sectionIdBase}-control-branch`}
                        className="text-input"
                        value={String(controlRelation.control.branch ?? "")}
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
                    className="panel-action"
                    onClick={() => removeControlRelation(selectedComponent.id)}
                  >
                    {t("panel.control.remove")}
                  </button>
                </>
              ) : (
                <p className="field-hint">{t("panel.control.empty")}</p>
              )}
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
