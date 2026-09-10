// Foundry AI coach — analysis, Q&A and document drafting.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-6-astra";

type Ctx = Record<string, unknown>;

const ANALYZE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    phase: { type: "string", enum: ["concept", "development", "commercialisation"] },
    phase_reason: { type: "string" },
    pws: {
      type: "object",
      additionalProperties: false,
      properties: {
        verdict: { type: "string" },
        criteria: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              key: { type: "string", enum: ["popular", "urgent", "costly", "mandatory", "frequent", "growing"] },
              score: { type: "number" },
              reason: { type: "string" },
            },
            required: ["key", "score", "reason"],
          },
        },
      },
      required: ["verdict", "criteria"],
    },
    canvas: {
      type: "object",
      additionalProperties: false,
      properties: {
        problem: { type: "string" },
        segments: { type: "string" },
        uvp: { type: "string" },
        solution: { type: "string" },
        channels: { type: "string" },
        revenue: { type: "string" },
        costs: { type: "string" },
        metrics: { type: "string" },
        advantage: { type: "string" },
      },
      required: ["problem", "segments", "uvp", "solution", "channels", "revenue", "costs", "metrics", "advantage"],
    },
    readiness: {
      type: "object",
      additionalProperties: false,
      properties: {
        fit: { type: "number" },
        model: { type: "number" },
        prototype: { type: "number" },
        market: { type: "number" },
      },
      required: ["fit", "model", "prototype", "market"],
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          stageId: { type: "string" },
          why: { type: "string" },
        },
        required: ["title", "stageId", "why"],
      },
    },
  },
  required: ["summary", "phase", "phase_reason", "pws", "canvas", "readiness", "priorities"],
};

function contextBlock(ctx: Ctx) {
  return `FOUNDER CONTEXT (JSON):\n${JSON.stringify(ctx ?? {}, null, 2)}`;
}

const BASE = `You are Foundry Coach, a pragmatic startup coach for first-time founders.
You know company registration, tax and municipal compliance, branding, business planning, operations, marketing, sales and growth.
You always give concrete, local, actionable guidance for the founder's country and industry — real institution names, real document names, realistic costs and timelines.
Never be vague. Never give a generic checklist. Speak plainly, no jargon, no fluff.`;

async function callGateway(body: Record<string, unknown>) {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({ model: MODEL, reasoning_effort: "low", ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: true, status: res.status, text };
  }
  const json = await res.json();
  return { error: false, json };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { action, context, question, history, target } = await req.json();

    if (action === "analyze") {
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nAnalyse the founder's idea and return structured JSON only.` },
          {
            role: "user",
            content: `${contextBlock(context)}

Do all of the following:
1. Score the idea on the six "worth solving" criteria (popular, urgent, costly, mandatory, frequent, growing) from 0-10 with a one-sentence reason each, then give a short verdict.
2. Place the founder on the innovation journey: concept, development, or commercialisation — with a reason.
3. Draft a first-pass Lean Canvas (all 9 blocks), specific to this business, 1-2 sentences per block.
4. Score readiness 0-100 for: problem-solution fit, business model, prototype, market readiness.
5. List the 4 highest-priority next actions, each with the stage it belongs to (one of: validation, compliance, documents, branding, plan, operations, marketing, growth) and why it matters now.`,
          },
        ],
        response_format: { type: "json_schema", json_schema: { name: "analysis", strict: true, schema: ANALYZE_SCHEMA } },
      });
      if (r.error) return err(r.status!, r.text!);
      const content = r.json.choices?.[0]?.message?.content ?? "{}";
      return ok(JSON.parse(content));
    }

    if (action === "ask") {
      const msgs = [
        { role: "system", content: `${BASE}\nAnswer the founder's question using their context. Use markdown. Be brief but concrete.\n\n${contextBlock(context)}` },
        ...(Array.isArray(history) ? history.slice(-12) : []),
        { role: "user", content: String(question ?? "") },
      ];
      const r = await callGateway({ messages: msgs });
      if (r.error) return err(r.status!, r.text!);
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }

    if (action === "draft") {
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nProduce a ready-to-use draft in markdown. No preamble, no "here is". Just the document.` },
          { role: "user", content: `${contextBlock(context)}\n\nDraft this for my business: ${String(target ?? "")}` },
        ],
      });
      if (r.error) return err(r.status!, r.text!);
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }

    return err(400, "Unknown action");
  } catch (e) {
    return err(500, e instanceof Error ? e.message : "Unexpected error");
  }
});

function ok(data: unknown) {
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
function err(status: number, message: string) {
  const friendly =
    status === 429
      ? "The coach is busy right now — try again in a moment."
      : status === 402
      ? "AI credits are exhausted. Add credits to keep using the coach."
      : message;
  return new Response(JSON.stringify({ error: friendly }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
