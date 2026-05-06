// Tiny markdown renderer with DOMPurify sanitization.
import React from "react";
import DOMPurify from "dompurify";

const PURIFY_CFG = {
  ALLOWED_TAGS: ["strong", "em", "code", "a"],
  ALLOWED_ATTR: ["href", "target", "rel", "class"],
  ALLOW_DATA_ATTR: false,
};

function safe(html) {
  return DOMPurify.sanitize(html, PURIFY_CFG);
}

function inlineFmt(text) {
  let t = text;
  t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|\W)\*(?!\s)([^\*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
  t = t.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener" class="text-[#38BDF8] underline">$1</a>');
  return safe(t);
}

// Stable, content-derived keys to avoid array-index pitfalls
const stableKey = (kind, idx, raw) => `${kind}-${idx}-${(raw || "").slice(0, 24).replace(/\s+/g, "_")}`;

export default function Markdown({ children }) {
  if (!children) return null;
  const lines = String(children).split("\n");
  const out = [];
  let listBuffer = null;
  let listType = null;
  let tableBuffer = null;

  const flushList = () => {
    if (!listBuffer) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    out.push(
      <Tag key={`l-${out.length}`}>
        {listBuffer.map((li, i) => (
          <li key={stableKey("li", i, li)} dangerouslySetInnerHTML={{ __html: inlineFmt(li) }} />
        ))}
      </Tag>
    );
    listBuffer = null;
    listType = null;
  };

  const flushTable = () => {
    if (!tableBuffer) return;
    const [head, , ...rows] = tableBuffer;
    const headers = head.split("|").map(s => s.trim()).filter(Boolean);
    const rowsParsed = rows.map(r => r.split("|").map(s => s.trim()).filter(Boolean));
    out.push(
      <table key={`t-${out.length}`}>
        <thead><tr>{headers.map((h, i) => <th key={stableKey("th", i, h)} dangerouslySetInnerHTML={{ __html: inlineFmt(h) }} />)}</tr></thead>
        <tbody>
          {rowsParsed.map((r, ri) => (
            <tr key={stableKey("tr", ri, r.join("|"))}>
              {r.map((c, ci) => <td key={stableKey("td", ci, c)} dangerouslySetInnerHTML={{ __html: inlineFmt(c) }} />)}
            </tr>
          ))}
        </tbody>
      </table>
    );
    tableBuffer = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw;
    if (/^\s*\|.+\|\s*$/.test(line)) {
      if (!tableBuffer) tableBuffer = [];
      tableBuffer.push(line.replace(/^\s*\||\|\s*$/g, ""));
      return;
    } else if (tableBuffer) { flushTable(); }

    const k = (kind) => stableKey(kind, idx, line);
    if (/^#\s+/.test(line)) { flushList(); out.push(<h1 key={k("h1")} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^#\s+/, "")) }} />); return; }
    if (/^##\s+/.test(line)) { flushList(); out.push(<h2 key={k("h2")} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^##\s+/, "")) }} />); return; }
    if (/^###\s+/.test(line)) { flushList(); out.push(<h3 key={k("h3")} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^###\s+/, "")) }} />); return; }
    if (/^>\s+/.test(line)) { flushList(); out.push(<blockquote key={k("bq")} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^>\s+/, "")) }} />); return; }

    const ulMatch = line.match(/^\s*[-*]\s+(.+)/);
    const olMatch = line.match(/^\s*\d+\.\s+(.+)/);
    if (ulMatch) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listBuffer = listBuffer || [];
      listBuffer.push(ulMatch[1]);
      return;
    }
    if (olMatch) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listBuffer = listBuffer || [];
      listBuffer.push(olMatch[1]);
      return;
    }

    flushList();
    if (line.trim() === "") {
      out.push(<div key={k("sp")} style={{ height: 6 }} />);
    } else {
      out.push(<p key={k("p")} dangerouslySetInnerHTML={{ __html: inlineFmt(line) }} />);
    }
  });
  flushList();
  flushTable();
  return <div className="markdown">{out}</div>;
}
