import { createOpenAI } from "@ai-sdk/openai";

const BASE_URL = "https://ai.gateway.lovable.dev/v1";
export const MODEL = "openai/gpt-6-astra";

export function createGatewayModel() {
  const apiKey = process.env['LOVABLE_API_KEY'];
  if (!apiKey) throw new Error("CONFIG");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: BASE_URL,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      if (runId && !headers.has("X-Lovable-AIG-Run-ID")) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
      return res;
    },
  });
  return provider.responses(MODEL);
}

export const OPENAI_OPTIONS = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

/** Maps gateway/SDK failures to safe pt-BR messages. Never logs resume content. */
export function friendlyAiError(error: unknown): string {
  const status =
    (error as { statusCode?: number })?.statusCode ??
    (error as { cause?: { statusCode?: number } })?.cause?.statusCode;
  if ((error as Error)?.message === "CONFIG")
    return "O serviço de análise não está configurado. Tente novamente mais tarde.";
  if (status === 429)
    return "Muitas solicitações em pouco tempo. Aguarde alguns instantes e tente novamente.";
  if (status === 402 || status === 403)
    return "O serviço de análise está temporariamente indisponível para esta conta. Tente novamente mais tarde.";
  if (status && status >= 500)
    return "O serviço de análise está instável no momento. Tente novamente em alguns instantes.";
  return "Não foi possível concluir o processamento. Verifique sua conexão e tente novamente.";
}
