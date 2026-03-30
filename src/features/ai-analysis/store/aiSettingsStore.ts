import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const DEFAULT_CIRCUIT_ANALYSIS_PROMPT = [
  "请直接根据电路图图片识别电路，不要依赖外部 JSON 或 ASCII。",
  "尽量保留细节：元件标签、参数数值与单位、极性、支路电流箭头、节点名称、开关状态、受控源关系、接地符号。",
  "如果某些内容无法从图片可靠识别，请明确标记为不确定，不要编造。",
  "请按以下结构输出：",
  "1. 电路概览",
  "2. 元件清单",
  "3. 节点与连接关系",
  "4. 已知方向/极性/控制关系",
  "5. 不确定项",
].join("\n");

type AISettingsStoreState = {
  baseURL: string;
  model: string;
  prompt: string;
  apiKey: string;
  setBaseURL: (baseURL: string) => void;
  setModel: (model: string) => void;
  setPrompt: (prompt: string) => void;
  resetPrompt: () => void;
  setApiKey: (apiKey: string) => void;
  clearApiKey: () => void;
};

export const useAISettingsStore = create<AISettingsStoreState>()(
  persist(
    (set) => ({
      baseURL: "",
      model: "",
      prompt: DEFAULT_CIRCUIT_ANALYSIS_PROMPT,
      apiKey: "",
      setBaseURL: (baseURL) => set({ baseURL }),
      setModel: (model) => set({ model }),
      setPrompt: (prompt) => set({ prompt }),
      resetPrompt: () => set({ prompt: DEFAULT_CIRCUIT_ANALYSIS_PROMPT }),
      setApiKey: (apiKey) => set({ apiKey }),
      clearApiKey: () => set({ apiKey: "" }),
    }),
    {
      name: "circuit-tutor-editor-ai-settings",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        baseURL: state.baseURL,
        model: state.model,
        prompt: state.prompt,
      }),
    },
  ),
);
