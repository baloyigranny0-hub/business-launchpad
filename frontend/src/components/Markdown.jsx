// Tiny markdown renderer (headings, bold, italic, lists, tables, code).
// Avoids extra deps. Good-enough for AI agent output.
import React from "react";

function inlineFmt(text) {
  // bold, italic, code
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|\W)\*(?!\s)([^\*\n]+?)\*(?!\w)/g, "$1<em>$2</em>");
  text = text.replace(/`([^`\n]+)`/g, "<code>$1</code>");
  // links
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-[#38BDF8] underline">$1</a>');
  return text;
}

export default function Markdown({ children }) {
  if (!children) return null;
  const lines = String(children).split("\n");
  const out = [];
  let listBuffer = null;
  let listType = null;
  let tableBuffer = null;

  const flushList = () => {
    if (listBuffer) {
      const Tag = listType === "ol" ? "ol" : "ul";
      out.push(
        <Tag key={`l${out.length}`}>
          {listBuffer.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(li) }} />
          ))}
        </Tag>
      );
      listBuffer = null;
      listType = null;
    }
  };

  const flushTable = () => {
    if (!tableBuffer) return;
    const [head, , ...rows] = tableBuffer; // skip separator row
    const headers = head.split("|").map(s => s.trim()).filter(Boolean);
    const rowsParsed = rows.map(r => r.split("|").map(s => s.trim()).filter(Boolean));
    out.push(
      <table key={`t${out.length}`}>
        <thead><tr>{headers.map((h, i) => <th key={i} dangerouslySetInnerHTML={{ __html: inlineFmt(h) }} />)}</tr></thead>
        <tbody>
          {rowsParsed.map((r, ri) => (
            <tr key={ri}>{r.map((c, ci) => <td key={ci} dangerouslySetInnerHTML={{ __html: inlineFmt(c) }} />)}</tr>
          ))}
        </tbody>
      </table>
    );
    tableBuffer = null;
  };

  lines.forEach((raw, idx) => {
    const line = raw;
    // table detection
    if (/^\s*\|.+\|\s*$/.test(line)) {
      if (!tableBuffer) tableBuffer = [];
      tableBuffer.push(line.replace(/^\s*\||\|\s*$/g, ""));
      return;
    } else if (tableBuffer) { flushTable(); }

    if (/^#\s+/.test(line)) { flushList(); out.push(<h1 key={idx} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^#\s+/, "")) }} />); return; }
    if (/^##\s+/.test(line)) { flushList(); out.push(<h2 key={idx} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^##\s+/, "")) }} />); return; }
    if (/^###\s+/.test(line)) { flushList(); out.push(<h3 key={idx} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^###\s+/, "")) }} />); return; }
    if (/^>\s+/.test(line)) { flushList(); out.push(<blockquote key={idx} dangerouslySetInnerHTML={{ __html: inlineFmt(line.replace(/^>\s+/, "")) }} />); return; }

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
      out.push(<div key={idx} style={{ height: 6 }} />);
    } else {
      out.push(<p key={idx} dangerouslySetInnerHTML={{ __html: inlineFmt(line) }} />);
    }
  });
  flushList();
  flushTable();
  return <div className="markdown">{out}</div>;
}
