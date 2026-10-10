import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE = "Foundry";
const BASE = "https://foundrybiz-coach-guide.lovable.app";

const META: Record<string, { title: string; description: string }> = {
  "/": { title: "Foundry — The Founder Command Center", description: "Foundry guides first-time founders from idea to a compliant, branded, operational business — one clear next action at a time." },
  "/auth": { title: "Sign in to Foundry", description: "Sign in or create your Foundry account to build your business roadmap, compliance checklist and plan." },
  "/reset-password": { title: "Reset your password — Foundry", description: "Choose a new password for your Foundry account." },
  "/onboarding": { title: "Tell us your idea — Foundry", description: "Answer a few quick questions so Foundry can build a roadmap tailored to your idea, industry and city." },
  "/app": { title: "Dashboard — Foundry", description: "Your next best action, phase progress and AI priorities for your business." },
  "/app/roadmap": { title: "Roadmap — Foundry", description: "Your step-by-step path from concept to commercialisation." },
  "/app/canvas": { title: "Lean Canvas — Foundry", description: "Map your problem, customers, solution and revenue on a nine-block Lean Canvas." },
  "/app/validation": { title: "Idea validation — Foundry", description: "Test whether your problem is worth solving: popular, urgent, costly, mandatory, frequent and growing." },
  "/app/compliance": { title: "Industry compliance — Foundry", description: "Your industry- and municipality-specific compliance checklist, plus help with government forms." },
  "/app/settings": { title: "Settings — Foundry", description: "Manage your founder profile and business details." },
};

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const m = META[path] ?? (path.startsWith("/app/module")
      ? { title: `Module — ${SITE}`, description: "Work through this module's steps and draft documents with your AI coach." }
      : { title: `Page not found — ${SITE}`, description: "This page doesn't exist." });
    document.title = m.title;
    setMeta("name", "description", m.description);
    setMeta("property", "og:title", m.title);
    setMeta("property", "og:description", m.description);
    setMeta("property", "og:url", `${BASE}${path === "/" ? "/" : path}`);
    setMeta("name", "twitter:title", m.title);
    setMeta("name", "twitter:description", m.description);
  }, [pathname]);
  return null;
}
