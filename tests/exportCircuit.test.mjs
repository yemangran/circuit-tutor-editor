import test from "node:test";
import assert from "node:assert/strict";
import {
  EXPORT_SCHEMA_VERSION,
  exportCircuit,
} from "./.tmp/exportCircuit.bundle.mjs";

function createDoc() {
  return {
    components: [
      {
        id: "R1",
        kind: "resistor",
        label: "R1",
        pins: ["a", "b"],
        parameters: {
          resistance: { magnitude: 10, unit: "Ohm" },
        },
        position: { x: 0, y: 0 },
        rotation: 0,
      },
      {
        id: "J1",
        kind: "junction",
        label: "J1",
        pins: ["n", "e", "w"],
        parameters: {},
        position: { x: 40, y: 0 },
        rotation: 0,
      },
    ],
    wires: [
      {
        id: "W1",
        from: { componentId: "J1", pinId: "n" },
        to: { componentId: "R1", pinId: "a" },
      },
      {
        id: "W2",
        from: { componentId: "J1", pinId: "e" },
        to: { componentId: "R1", pinId: "b" },
      },
    ],
    annotations: [],
    namedNodes: [
      {
        id: "J1:w",
        label: "+",
        position: { x: 40, y: 0 },
      },
    ],
    controlRelations: [],
    solveTargets: [],
    meta: {
      title: "Junction export test",
    },
  };
}

test("exportCircuit emits schema v2 and node-level junction summaries", () => {
  const result = exportCircuit(createDoc());
  const [junction] = result.payload.junctions;

  assert.equal(result.payload.schemaVersion, EXPORT_SCHEMA_VERSION);
  assert.equal(junction.node, "POS");
  assert.equal(junction.junctionType, "wire_splice");
  assert.deepEqual(junction.connectedComponents, [
    {
      componentId: "R1",
      componentKind: "resistor",
      componentLabel: "R1",
      pinId: "a",
    },
    {
      componentId: "R1",
      componentKind: "resistor",
      componentLabel: "R1",
      pinId: "b",
    },
  ]);
});

test("exportCircuit junction summaries exclude the junction's own pins", () => {
  const result = exportCircuit(createDoc());
  const [junction] = result.payload.junctions;

  assert.equal(
    junction.connectedComponents.some(
      (connection) => connection.componentId === "J1",
    ),
    false,
  );
});

