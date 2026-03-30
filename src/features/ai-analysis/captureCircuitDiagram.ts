import { toPng } from "html-to-image";

export type CircuitDiagramCaptureResult = {
  dataUrl: string;
  width: number;
  height: number;
};

function shouldExcludeFromCapture(node: HTMLElement) {
  const classList = node.classList;

  return (
    classList.contains("react-flow__controls") ||
    classList.contains("react-flow__attribution") ||
    classList.contains("canvas-context-menu")
  );
}

export async function captureCircuitDiagram(): Promise<CircuitDiagramCaptureResult> {
  const stage = document.querySelector<HTMLElement>(".canvas-stage");

  if (!stage) {
    throw new Error("Circuit canvas not found.");
  }

  const dataUrl = await toPng(stage, {
    backgroundColor: "#f7faff",
    cacheBust: true,
    pixelRatio: 2,
    skipFonts: true,
    filter: (node) =>
      !(node instanceof HTMLElement) || !shouldExcludeFromCapture(node),
  });

  return {
    dataUrl,
    width: stage.clientWidth,
    height: stage.clientHeight,
  };
}
