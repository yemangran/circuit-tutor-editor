import OpenAI from "openai";

export type AnalyzeCircuitDiagramOptions = {
  apiKey: string;
  baseURL: string;
  model: string;
  prompt: string;
  title: string;
  imageDataUrl: string;
};

function buildAnalysisPrompt(title: string, prompt: string) {
  return [
    `电路图名称：${title || "未命名电路图"}`,
    "",
    prompt.trim(),
  ].join("\n");
}

export async function analyzeCircuitDiagram(
  options: AnalyzeCircuitDiagramOptions,
): Promise<string> {
  const client = new OpenAI({
    apiKey: options.apiKey,
    baseURL: options.baseURL.trim() || undefined,
    dangerouslyAllowBrowser: true,
  });

  const response = await client.responses.create({
    model: options.model.trim(),
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildAnalysisPrompt(options.title, options.prompt),
          },
          {
            type: "input_image",
            image_url: options.imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
  });

  const outputText = response.output_text?.trim();

  if (!outputText) {
    throw new Error("The model returned no text output.");
  }

  return outputText;
}
