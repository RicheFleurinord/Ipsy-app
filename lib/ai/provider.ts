/**
 * Couche fournisseur IA — un seul point à modifier pour changer de modèle.
 * Fournisseurs gratuits supportés : Google Gemini API (free tier) et Groq (free tier,
 * API compatible OpenAI). Les clés sont lues uniquement côté serveur.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type ProviderName = "gemini" | "groq";

export class ProviderError extends Error {
  constructor(
    public code: "config" | "rate" | "upstream" | "blocked",
    message: string,
  ) {
    super(message);
  }
}

type Opts = { system: string; messages: ChatMessage[]; signal?: AbortSignal };

const env = (k: string) => process.env[k]?.trim() || undefined;

export function configuredProviders(): ProviderName[] {
  const primary = (env("AI_PROVIDER") as ProviderName | undefined) ?? "gemini";
  const order: ProviderName[] = primary === "groq" ? ["groq", "gemini"] : ["gemini", "groq"];
  return order.filter((p) => (p === "gemini" ? env("GEMINI_API_KEY") : env("GROQ_API_KEY")));
}

/** Ouvre un flux de texte auprès du fournisseur. Lève ProviderError avant tout octet en cas d'échec. */
export async function streamFrom(provider: ProviderName, o: Opts): Promise<AsyncGenerator<string>> {
  return provider === "gemini" ? streamGemini(o) : streamGroq(o);
}

async function check(res: Response) {
  if (res.ok && res.body) return;
  // Ne pas journaliser le corps : il peut contenir des fragments de la conversation.
  if (res.status === 429) throw new ProviderError("rate", "rate limited");
  if (res.status === 401 || res.status === 403) throw new ProviderError("config", `auth ${res.status}`);
  throw new ProviderError("upstream", `status ${res.status}`);
}

async function* sseLines(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line.startsWith("data:")) yield line.slice(5).trim();
    }
  }
  if (buf.trim().startsWith("data:")) yield buf.trim().slice(5).trim();
}

/* ---------------- Google Gemini ---------------- */
async function streamGemini({ system, messages, signal }: Opts) {
  const key = env("GEMINI_API_KEY");
  if (!key) throw new ProviderError("config", "missing GEMINI_API_KEY");
  const model = env("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const base = env("GEMINI_BASE_URL") ?? "https://generativelanguage.googleapis.com/v1beta";
  const generationConfig: Record<string, unknown> = { temperature: 0.7, maxOutputTokens: 700 };
  if (/2\.5-flash/.test(model)) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  const res = await fetch(`${base}/models/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig,
    }),
  });
  await check(res);

  return (async function* () {
    for await (const data of sseLines(res.body!)) {
      let j: {
        candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
        promptFeedback?: { blockReason?: string };
      };
      try {
        j = JSON.parse(data);
      } catch {
        continue;
      }
      if (j.promptFeedback?.blockReason) throw new ProviderError("blocked", "prompt blocked");
      const c = j.candidates?.[0];
      const text = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (text) yield text;
      if (c?.finishReason === "SAFETY" || c?.finishReason === "PROHIBITED_CONTENT") {
        throw new ProviderError("blocked", "response blocked");
      }
    }
  })();
}

/* ---------------- Groq (compatible OpenAI) ---------------- */
async function streamGroq({ system, messages, signal }: Opts) {
  const key = env("GROQ_API_KEY");
  if (!key) throw new ProviderError("config", "missing GROQ_API_KEY");
  const model = env("GROQ_MODEL") ?? "llama-3.3-70b-versatile";
  const base = env("GROQ_BASE_URL") ?? "https://api.groq.com/openai/v1";

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  await check(res);

  return (async function* () {
    for await (const data of sseLines(res.body!)) {
      if (data === "[DONE]") return;
      try {
        const j = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
        const text = j.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch {
        /* ligne partielle ignorée */
      }
    }
  })();
}
