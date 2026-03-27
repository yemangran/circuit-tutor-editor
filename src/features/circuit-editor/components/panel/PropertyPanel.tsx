import { resolveNodes } from "../../resolveNodes";
import { useCircuitStore } from "../../store/circuitStore";
import type {
  BranchCurrentAnnotation,
  ControlRelation,
  ParameterValue,
} from "../../types/circuit";
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
  const selectedWireId = useCircuitStore((state) => state.selectedWireId);
  const updateComponentLabel = useCircuitStore(
    (state) => state.updateComponentLabel,
  );
  const updateComponentParameter = useCircuitStore(
    (state) => state.updateComponentParameter,
  );
  const updateComponentRotation = useCircuitStore(
    (state) => state.updateComponentRotation,
  );
  const updateComponentState = useCircuitStore(
    (state) => state.updateComponentState,
  );
  const addComponentPin = useCircuitStore((state) => state.addComponentPin);
  const removeJunctionPin = useCircuitStore((state) => state.removeJunctionPin);
  const upsertBranchCurrentAnnotation = useCircuitStore(
    (state) => state.upsertBranchCurrentAnnotation,
  );
  const removeBranchCurrentAnnotation = useCircuitStore(
    (state) => state.removeBranchCurrentAnnotation,
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
  const selectedWire = doc.wires.find((wire) => wire.id === selectedWireId);
  const selectedBranchCurrent = doc.annotations.find(
    (annotation): annotation is BranchCurrentAnnotation =>
      annotation.type === "branch_current" &&
      annotation.targetWireIds.includes(selectedWireId ?? ""),
  );

  const resolved = resolveNodes({
    components: doc.components,
    wires: doc.wires,
    namedNodes: doc.namedNodes,
  });

  if (!selectedComponent && !selectedWire) {
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

  if (selectedWire) {
    const sectionIdBase = selectedWire.id;
    const fromNode = resolved.pinToNode[
      makePinKey(selectedWire.from.componentId, selectedWire.from.pinId)
    ];
    const toNode = resolved.pinToNode[
      makePinKey(selectedWire.to.componentId, selectedWire.to.pinId)
    ];
    const branchCurrent = selectedBranchCurrent;

    return (
      <aside
        className="studio-card inspector-panel"
        style={{ overflowY: "auto" }}
      >
        <div className="panel-header">
          <h2 className="panel-title">{t("panel.branchCurrent.title")}</h2>
          <p className="panel-subtitle">
            {t("panel.branchCurrent.subtitle", { id: selectedWire.id })}
          </p>
        </div>

        <div className="panel-stack">
          <section className="panel-section">
            <div className="section-stack">
              <div className="pill-card">
                <div className="field-label">
                  {t("panel.branchCurrent.direction")}
                </div>
                <p className="support-text">
                  {t("panel.branchCurrent.directionHint", {
                    from: branchCurrent ? resolved.pinToNode[
                      makePinKey(
                        branchCurrent.fromPinRef.componentId,
                        branchCurrent.fromPinRef.pinId,
                      )
                    ] : fromNode,
                    to: branchCurrent ? resolved.pinToNode[
                      makePinKey(
                        branchCurrent.toPinRef.componentId,
                        branchCurrent.toPinRef.pinId,
                      )
                    ] : toNode,
                  })}
                </p>
              </div>

              {!branchCurrent ? (
                <button
                  type="button"
                  className="panel-action"
                  data-tone="secondary"
                  onClick={() => upsertBranchCurrentAnnotation(selectedWire.id)}
                >
                  {t("panel.branchCurrent.create")}
                </button>
              ) : (
                <>
                  <div className="field-stack">
                    <label
                      className="field-label"
                      htmlFor={`${sectionIdBase}-branch-current-label`}
                    >
                      {t("panel.branchCurrent.label")}
                    </label>
                    <input
                      id={`${sectionIdBase}-branch-current-label`}
                      className="text-input"
                      value={branchCurrent.label}
                      onChange={(event) =>
                        upsertBranchCurrentAnnotation(selectedWire.id, {
                          label: event.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="panel-actions-row">
                    <button
                      type="button"
                      className="panel-action"
                      data-tone="secondary"
                      onClick={() =>
                        upsertBranchCurrentAnnotation(selectedWire.id, {
                          fromPinRef: branchCurrent.toPinRef,
                          toPinRef: branchCurrent.fromPinRef,
                        })
                      }
                    >
                      {t("panel.branchCurrent.reverse")}
                    </button>
                    <button
                      type="button"
                      className="panel-action"
                      onClick={() =>
                        removeBranchCurrentAnnotation(selectedWire.id)
                      }
                    >
                      {t("panel.branchCurrent.remove")}
                    </button>
                  </div>

                  <div className="field-row">
                    <div className="field-stack">
                      <label
                        className="field-label"
                        htmlFor={`${sectionIdBase}-branch-current-magnitude`}
                      >
                        {t("panel.fields.magnitude")}
                      </label>
                      <input
                        id={`${sectionIdBase}-branch-current-magnitude`}
                        className="text-input"
                        type="number"
                        value={
                          branchCurrent.value?.magnitude == null
                            ? ""
                            : `${branchCurrent.value.magnitude}`
                        }
                        onChange={(event) =>
                          upsertBranchCurrentAnnotation(selectedWire.id, {
                            value: {
                              ...branchCurrent.value,
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
                        className="field-label"
                        htmlFor={`${sectionIdBase}-branch-current-unit`}
                      >
                        {t("panel.fields.unit")}
                      </label>
                      <input
                        id={`${sectionIdBase}-branch-current-unit`}
                        className="text-input"
                        value={branchCurrent.value?.unit ?? "A"}
                        onChange={(event) =>
                          upsertBranchCurrentAnnotation(selectedWire.id, {
                            value: {
                              ...branchCurrent.value,
                              unit: event.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={Boolean(branchCurrent.value?.isUnknown)}
                      onChange={(event) =>
                        upsertBranchCurrentAnnotation(selectedWire.id, {
                          value: {
                            ...branchCurrent.value,
                            isUnknown: event.target.checked,
                          },
                        })
                      }
                    />
                    {t("panel.branchCurrent.unknown")}
                  </label>
                </>
              )}
            </div>
          </section>
        </div>
      </aside>
    );
  }

  if (!selectedComponent) {
    return null;
  }

  const namedNodeMap = Object.fromEntries(
    doc.namedNodes.map((namedNode) => [namedNode.id, namedNode.label]),
  );
  const connectedPinKeys = new Set(
    doc.wires.flatMap((wire) => [
      makePinKey(wire.from.componentId, wire.from.pinId),
      makePinKey(wire.to.componentId, wire.to.pinId),
    ]),
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

            <div className="field-stack">
              <div className="field-label">{t("panel.fields.rotation")}</div>
              <div className="panel-actions-row">
                <button
                  type="button"
                  className="panel-action rotation-btn"
                  data-tone="secondary"
                  onClick={() =>
                    updateComponentRotation(
                      selectedComponent.id,
                      ((selectedComponent.rotation + 270) %
                        360) as 0 | 90 | 180 | 270,
                    )
                  }
                >
                  {t("panel.fields.rotateLeft")}
                </button>
                <button
                  type="button"
                  className="panel-action rotation-btn"
                  data-tone="secondary"
                  onClick={() =>
                    updateComponentRotation(
                      selectedComponent.id,
                      ((selectedComponent.rotation + 90) %
                        360) as 0 | 90 | 180 | 270,
                    )
                  }
                >
                  {t("panel.fields.rotateRight")}
                </button>
              </div>
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
            <div className="meta-row">
              <h3 className="section-title">{t("panel.fields.nodeLabels")}</h3>
              {selectedComponent.kind === "junction" ? (
                <button
                  type="button"
                  className="panel-action"
                  data-tone="secondary"
                  onClick={() => addComponentPin(selectedComponent.id)}
                >
                  {t("panel.fields.addPin")}
                </button>
              ) : null}
            </div>
            {selectedComponent.kind === "junction" ? (
              <p className="field-hint">{t("panel.fields.junctionPinsHint")}</p>
            ) : null}
            {selectedComponent.pins.map((pinId) => {
              const pinKey = makePinKey(selectedComponent.id, pinId);
              const nodeLabel = resolved.pinToNode[pinKey] ?? "";
              const namedLabel = namedNodeMap[pinKey] ?? "";
              const isConnected = connectedPinKeys.has(pinKey);
              const canRemovePin =
                selectedComponent.kind === "junction" &&
                !isConnected &&
                selectedComponent.pins.length > 3;

              return (
                <div key={pinKey} className="pill-card">
                  <div className="meta-row">
                    <div className="field-label">{pinId}</div>
                    <div className="panel-actions-row" style={{ gap: 8 }}>
                      <div className="palette-prefix">
                        {nodeLabel || t("panel.fields.unresolved")}
                      </div>
                      {canRemovePin ? (
                        <button
                          type="button"
                          className="panel-action"
                          onClick={() =>
                            removeJunctionPin(selectedComponent.id, pinId)}
                        >
                          {t("panel.fields.removePin")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="field-hint" style={{ marginTop: 10 }}>
                    {t("panel.fields.currentNode", {
                      label: nodeLabel || t("panel.fields.unresolved"),
                    })}
                  </p>
                  {selectedComponent.kind === "junction" ? (
                    <p className="field-hint" style={{ marginTop: 8 }}>
                      {isConnected
                        ? t("panel.fields.pinConnected")
                        : t("panel.fields.pinUnconnected")}
                    </p>
                  ) : null}
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
