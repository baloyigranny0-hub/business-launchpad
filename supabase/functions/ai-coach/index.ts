// Foundry AI coach — analysis, Q&A and document drafting.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "openai/gpt-6-astra";

type Ctx = Record<string, unknown>;

const RequestSchema = z.object({
  action: z.enum(["analyze", "ask", "draft", "compliance", "formscreen", "orchestrate", "stress"]),
  context: z.record(z.unknown()),
  question: z.string().trim().max(4000).optional(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(8000) })).max(20).optional(),
  target: z.string().trim().max(2000).optional(),
  packId: z.string().trim().max(80).optional(),
  packLabel: z.string().trim().max(120).optional(),
  focus: z.array(z.string().trim().max(200)).max(12).optional(),
  formId: z.string().trim().max(80).optional(),
  formLabel: z.string().trim().max(200).optional(),
  formSection: z.string().trim().max(200).optional(),
  image: z.string().startsWith("data:image/").max(7_000_000).optional(),
});


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

const ORCHESTRATE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      maxItems: 40,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          due_day: { type: "integer" },
          priority: { type: "string", enum: ["high", "medium", "low"] },
          category: {
            type: "string",
            enum: ["registration", "compliance", "documents", "branding", "operations", "marketing", "sales", "finance", "validation", "growth"],
          },
          institution: { type: ["string", "null"] },
          requires_approval: { type: "boolean" },
        },
        required: ["title", "detail", "due_day", "priority", "category", "institution", "requires_approval"],
      },
    },
  },
  required: ["tasks"],
};

const STRESS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    verdict: { type: "string" },
    risks: {
      type: "array",
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          vector: { type: "string", enum: ["cash-flow", "pricing", "fixed-overheads", "demand", "competition", "compliance", "capacity", "key-person"] },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          title: { type: "string" },
          evidence: { type: "string" },
          mitigation: { type: "string" },
          horizon: { type: "string", enum: ["now", "30 days", "90 days"] },
        },
        required: ["vector", "severity", "title", "evidence", "mitigation", "horizon"],
      },
    },
  },
  required: ["verdict", "risks"],
};

function contextBlock(ctx: Ctx) {
  return `FOUNDER CONTEXT (JSON):\n${JSON.stringify(ctx ?? {}, null, 2)}`;
}

function hasRequiredContext(ctx: Ctx) {
  const business = ctx.business as Record<string, unknown> | undefined;
  return [business?.idea, business?.customer, business?.industry, business?.country, business?.city].every((value) => typeof value === "string" && value.trim().length > 0);
}

const BASE = `You are Foundry Coach, a pragmatic startup coach for first-time founders.
You know company registration, tax and municipal compliance, branding, business planning, operations, marketing, sales and growth.
Every response must be explicitly associated with the founder's stated industry, country, city or municipality, customers, and current business stage.
Give concrete, local, actionable guidance — real institution names, document names, realistic costs and timelines. Clearly label facts the founder must verify because rules change.
Never give a generic checklist, invent an authority, or silently assume missing context. Speak plainly, no jargon, no fluff.`;

const FORM_COACH = `You are an expert South African Business Compliance & Form Coach for Foundry.
You assist founders through government platforms including SARS eFiling, CIPC/BizPortal, Department of Employment & Labour (UIF/UI-19) and COIDA (Compensation Fund).

GUIDELINES:
1. IDENTIFY: Read the attached screen, and state the exact organisation, form name (e.g. ITR14, RAV01, VAT201, EMP201, CoR14.1, UI-19, W.As.8) and the current step or container. If the screen is unclear, say what you can and cannot see instead of guessing.
2. LOCATE FRICTION: Point out visible red error highlights, greyed-out options, mandatory-but-empty fields and vague labels causing confusion.
3. EXPLAIN & GUIDE: Give a concise field-by-field explanation in plain English, 2-3 sentences per field, stating what value belongs there based on the founder's business profile (industry, city, entity type, VAT/PAYE status). End with "Next field to complete:" and one clear action.
4. SAFETY: You only guide. Never auto-fill, never submit, never ask for or output passwords, OTPs, full 13-digit ID numbers or bank account numbers. If a masked or blacked-out area matters, describe what belongs there generically.
5. DISCLAIMER: Close with a one-line reminder that this is guidance only and does not replace a registered Tax Practitioner or CA(SA), and that fees, forms and deadlines must be confirmed with the authority.

Format in short markdown with bold field names. Always anchor advice to the founder's stated industry, city/municipality and stage.`;


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
    const authorization = req.headers.get("Authorization");
    const url = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authorization || !url || !anonKey) return err(401, "Sign in to use the Foundry coach.");
    const client = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
    const { data: authData, error: authError } = await client.auth.getUser();
    if (authError || !authData.user) return err(401, "Your session has expired. Sign in again.");

    const parsed = RequestSchema.safeParse(await req.json());
    if (!parsed.success) return err(400, "That request is incomplete or too long.");
    const { action, context, question, history, target, packId, packLabel, focus, formId, formLabel, formSection, image } = parsed.data;
    if (!hasRequiredContext(context)) return err(400, "Add your industry, country, city, customer and business idea before using the coach.");

    if (action === "formscreen") {
      const userContent: Record<string, unknown>[] = [
        {
          type: "text",
          text: `${contextBlock(context)}

Platform/form the founder selected: ${formLabel ?? formId ?? "not selected"}${formSection ? ` — section/field: ${formSection}` : ""}
Founder's question: ${question?.trim() || "I am stuck on this screen. Tell me exactly what to do next."}
${image ? "A screenshot of the current screen is attached. Sensitive areas may already be blacked out — never ask what is behind a mask." : "No screenshot was provided — give text-based guidance for the selected form and section, and say what to look for on screen."}`,
        },
      ];
      if (image) userContent.push({ type: "image_url", image_url: { url: image } });

      const r = await callGateway({
        messages: [
          { role: "system", content: FORM_COACH },
          ...(Array.isArray(history) ? history.slice(-10) : []),
          { role: "user", content: userContent },
        ],
      });
      if (r.error) return err(r.status ?? 500, r.text ?? "The form coach could not read that screen.");
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }



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
      if (r.error) return err(r.status ?? 500, r.text ?? "The coach could not complete the analysis.");
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
      if (r.error) return err(r.status ?? 500, r.text ?? "The coach could not answer that question.");
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }

    if (action === "draft") {
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nProduce a ready-to-use draft in markdown. No preamble, no "here is". Just the document.` },
          { role: "user", content: `${contextBlock(context)}\n\nDraft this for my business: ${String(target ?? "")}` },
        ],
      });
      if (r.error) return err(r.status ?? 500, r.text ?? "The coach could not create that draft.");
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }

    if (action === "compliance") {
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nYou are producing a practical compliance workspace, not legal advice. Use markdown. No preamble.` },
          { role: "user", content: `${contextBlock(context)}

Create a personalized compliance pack using starter pack ${String(packLabel ?? packId ?? "custom")} and these sector focus areas: ${(focus ?? []).join(", ")}.

Include these sections:
1. Applicability summary tied to this exact business model and customer.
2. National registrations and tax obligations.
3. City or municipal permissions, zoning, premises, signage, fire, health and safety requirements that may apply.
4. Industry regulator, licences, permits, certifications and professional registrations.
5. Required evidence and documents, naming forms where reliably known.
6. A table with requirement, authority, when needed, owner, estimated fee/time, renewal date or frequency, status checkbox, and verification source.
7. Worker, customer, data, environmental and insurance obligations relevant to this sector.
8. A 30-day order of action split into Do now, Before trading, and Renew or monitor.
9. A verification box listing uncertain or changing rules that must be confirmed directly.

Never substitute another industry's rules. If a requirement depends on activities not stated, phrase it as a clear condition such as “If you prepare food on site…”.` },
        ],
      });
      if (r.error) return err(r.status ?? 500, r.text ?? "The coach could not create that compliance pack.");
      return ok({ text: r.json.choices?.[0]?.message?.content ?? "" });
    }

    if (action === "orchestrate") {
      const business = (context.business ?? {}) as Record<string, unknown>;
      const experience = String(business.experience ?? "novice");
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nYou are the Foundry execution brain. Decompose the founder's 90-day plan into concrete daily micro-tasks and return structured JSON only.` },
          {
            role: "user",
            content: `${contextBlock(context)}

Turn the founder's 90-day goal into 18-26 micro-tasks:
- Order matters: legal registrations, permits and compliance actions come first; documents and branding follow; then operations, marketing and sales.
- due_day: day number 1-90 from today, weighted toward the first 30 days (e.g. 3, 7, 14, 21, 30). Front-load compliance deadlines.
- detail: one to two sentences. The founder's experience level is "${experience}": for a novice explain what the task involves and how to do it; for "some" or "experienced" be terse and assume they know the institutions.
- Every task must be specific to this founder's industry, city or municipality, customers and stage — never generic.
- institution: the authority or platform involved (e.g. "CIPC BizPortal", "SARS eFiling", "UIF uFiling", "COIDA Compensation Fund", "Municipality"), or null for internal tasks like branding or pricing work.
- requires_approval: true for any task where something is submitted, paid, or signed with an authority — the founder must approve before it happens; false for internal preparation work.
- Cover the categories this business actually needs across registration, compliance, documents, branding, operations, marketing, sales, finance and growth.`,
          },
        ],
        response_format: { type: "json_schema", json_schema: { name: "execution_plan", strict: true, schema: ORCHESTRATE_SCHEMA } },
      });
      if (r.error) return err(r.status ?? 500, r.text ?? "The execution brain could not build the plan.");
      return ok(JSON.parse(r.json.choices?.[0]?.message?.content ?? "{}"));
    }

    if (action === "stress") {
      const r = await callGateway({
        messages: [
          { role: "system", content: `${BASE}\nYou are a startup failure diagnostician running a pre-capital stress test. Return structured JSON only.` },
          {
            role: "user",
            content: `${contextBlock(context)}

Stress-test this idea before the founder deploys money. Audit it against the real reasons startups die:
- cash-flow starvation: money arriving later than money going out
- underpricing — especially travel, labour and consumables for mobile or on-site businesses
- high fixed overheads (rent, vehicles, salaries) taken on too early
- unproven demand or a customer segment too small to pay
- competition and customer switching behaviour
- compliance costs or delays blocking launch (licences, permits, registrations)
- founder capacity and key-person risk

Find 3-6 risks grounded in the founder's actual inputs — reference their own numbers, customers, industry and city. Do not invent figures; where numbers are missing, express estimates as ranges or conditions ("if fuel runs R2 000/month..."). For each risk give: vector, severity (high = could kill the business within 90 days), a plain-English title, the evidence from their inputs, a concrete mitigation with numbers where possible, and the horizon when it starts to bite. Verdict: one short paragraph saying whether to proceed, adjust, or pause — and why.`,
          },
        ],
        response_format: { type: "json_schema", json_schema: { name: "stress_test", strict: true, schema: STRESS_SCHEMA } },
      });
      if (r.error) return err(r.status ?? 500, r.text ?? "The stress test could not run.");
      return ok(JSON.parse(r.json.choices?.[0]?.message?.content ?? "{}"));
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
