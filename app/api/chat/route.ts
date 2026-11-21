import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { configuredProviders, ProviderError, streamFrom, type ChatMessage } from "@/lib/ai/provider";
import { keywordLevel, maxLevel, parseLevelTag, type Level } from "@/lib/ai/safety";

// POST n'est jamais mis en cache ; runtime Node.js par défaut.

const MAX_MESSAGES = 20;
const MAX_CHARS = 2000;
const RATE_LIMIT = 15; // requêtes / minute / IP
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT;
}

const fail = (status: number, code: string) =>
  Response.json({ error: code }, { status, headers: { "Cache-Control": "no-store" } });

const TAG_RE = /\[\[\s*(vert|orange|rouge)\s*\]\]\s*/gi;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return fail(429, "rate");

  let body: { messages?: unknown; lang?: unknown };
  try {
    body = await req.json();
  } catch {
    return fail(400, "bad_request");
  }

  const raw = Array.isArray(body.messages) ? body.messages : [];
  const messages: ChatMessage[] = raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string" &&
        (m as ChatMessage).content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);

  // Gemini exige que l'historique commence par un message utilisateur.
  while (messages.length && messages[0].role !== "user") messages.shift();
  const last = messages[messages.length - 1];
  if (!last || last.role !== "user") return fail(400, "bad_request");

  const lang = body.lang === "ht" ? "ht" : "fr";
  const providers = configuredProviders();
  if (providers.length === 0) return fail(503, "config");

  const kwLevel = keywordLevel(last.content);
  const system = buildSystemPrompt(lang);

  let lastCode = "upstream";
  for (const provider of providers) {
    try {
      const gen = await streamFrom(provider, { system, messages, signal: req.signal });

      // Lire le début de la réponse pour extraire le niveau avant d'envoyer quoi que ce soit.
      let head = "";
      let tagLevel: Level | null = null;
      let finished = false;
      while (true) {
        const { value, done } = await gen.next();
        if (done) {
          finished = true;
          break;
        }
        head += value;
        tagLevel = parseLevelTag(head);
        if (tagLevel || head.replace(/^\s*\[*/, "").length > 40) break;
      }
      const content = head.replace(TAG_RE, "").replace(/^\s+/, "");
      if (finished && !content) throw new ProviderError("blocked", "empty");

      const level = maxLevel(kwLevel, tagLevel ?? "vert");
      const enc = new TextEncoder();
      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          controller.enqueue(enc.encode(`${level}\n${content}`));
          if (!finished) {
            try {
              for await (const chunk of gen) controller.enqueue(enc.encode(chunk.replace(TAG_RE, "")));
            } catch {
              controller.enqueue(enc.encode("\n[[IPSY_ERROR]]"));
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
          "X-IPsy-Provider": provider,
        },
      });
    } catch (e) {
      if (req.signal.aborted) return fail(499, "aborted");
      if (e instanceof ProviderError) {
        // Aucune donnée de conversation n'est journalisée, seulement le code d'erreur.
        console.warn(`[ipsy] provider ${provider} failed: ${e.code}`);
        if (e.code === "blocked") return fail(422, "blocked");
        lastCode = e.code;
        continue;
      }
      console.warn(`[ipsy] provider ${provider} network error`);
      lastCode = "upstream";
    }
  }

  return fail(lastCode === "rate" ? 429 : lastCode === "config" ? 503 : 502, lastCode);
}
