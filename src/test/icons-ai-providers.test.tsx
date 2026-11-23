import { render } from "@testing-library/react";
import {
  IconAnthropic,
  IconAzure,
  IconBedrock,
  IconCohere,
  IconDeepSeek,
  IconDocker,
  IconGemini,
  IconGroq,
  IconHuggingFace,
  IconMistral,
  IconNvidia,
  IconOllama,
  IconOpenAI,
  IconVertexAI,
  IconVllm,
  IconXAI,
} from "../custom/icons";

const MARKS = [
  ["OpenAI", IconOpenAI],
  ["Anthropic", IconAnthropic],
  ["Gemini", IconGemini],
  ["Vertex AI", IconVertexAI],
  ["Azure", IconAzure],
  ["Amazon Bedrock", IconBedrock],
  ["Cohere", IconCohere],
  ["Mistral AI", IconMistral],
  ["Groq", IconGroq],
  ["DeepSeek", IconDeepSeek],
  ["xAI", IconXAI],
  ["Hugging Face", IconHuggingFace],
  ["NVIDIA", IconNvidia],
  ["Ollama", IconOllama],
  ["vLLM", IconVllm],
  ["Docker", IconDocker],
] as const;

describe("AI-provider and Docker marks", () => {
  it.each(MARKS)("%s renders one currentColor svg titled with its brand", (name, Icon) => {
    const { container } = render(<Icon />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(1);
    const svg = svgs[0] as SVGSVGElement;
    expect(svg.getAttribute("fill")).toBe("currentColor");
    expect(svg.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg.getAttribute("role")).toBe("img");
    expect(svg.querySelector("title")?.textContent).toBe(name);
    expect(svg.querySelectorAll("path").length).toBeGreaterThan(0);
  });

  it.each(MARKS)("%s never puts colorful on the svg", (_name, Icon) => {
    const { container } = render(<Icon colorful="true" />);
    expect(container.querySelector("svg")?.hasAttribute("colorful")).toBe(false);
  });

  it("forwards other svg props", () => {
    const { container } = render(<IconOpenAI className="size-4" />);
    expect(container.querySelector("svg")?.getAttribute("class")).toBe("size-4");
  });
});
