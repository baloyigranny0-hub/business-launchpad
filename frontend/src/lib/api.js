import axios from "axios";

const BASE = process.env.REACT_APP_BACKEND_URL;
export const API = `${BASE}/api`;

export const api = axios.create({ baseURL: API, timeout: 120000 });

export const SESSION_KEY = "vula_session_id";

export function getSessionId() {
  let s = localStorage.getItem(SESSION_KEY);
  if (!s) {
    s = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

export const ROOMS = [
  { key: "journey",   name: "Your Journey",      sub: "Personalized roadmap",   icon: "MapTrifold",    agent: null,         color: "#D4AF37" },
  { key: "briefing",  name: "Briefing Room",     sub: "Ideation & Strategy",   icon: "Compass",       agent: "research",   color: "#38BDF8" },
  { key: "legal",     name: "Legal Desk",        sub: "Compliance Roadmap",    icon: "Scales",        agent: "compliance", color: "#D4AF37" },
  { key: "design",    name: "Design Studio",     sub: "Brand & Profile",       icon: "PaintBrush",    agent: "brand",      color: "#F472B6" },
  { key: "marketing", name: "Marketing War Room",sub: "Growth Strategies",     icon: "Megaphone",     agent: "marketing",  color: "#34D399" },
  { key: "ops",       name: "Operations Floor",  sub: "Daily Systems & SOPs",  icon: "GearSix",       agent: "operations", color: "#FBBF24" },
  { key: "salesgym",  name: "Sales Gym",         sub: "Roleplay & Practice",   icon: "Barbell",       agent: "sales_gym",  color: "#FB7185" },
  { key: "vault",     name: "Vault",             sub: "Saved Documents",       icon: "Vault",         agent: null,         color: "#A78BFA" },
];

export const ROOM_BY_KEY = Object.fromEntries(ROOMS.map(r => [r.key, r]));
