import React, { useEffect, useState } from "react";
import { Vault as VaultIcon, Trash, DownloadSimple, Eye } from "@phosphor-icons/react";
import RoomHeader from "@/components/RoomHeader";
import Markdown from "@/components/Markdown";
import { api } from "@/lib/api";

export default function Vault({ profile, sessionId }) {
  const [docs, setDocs] = useState([]);
  const [active, setActive] = useState(null);

  const load = () => api.get(`/vault/${sessionId}`).then(r => setDocs(r.data || []));
  useEffect(() => { load(); }, [sessionId]);

  const remove = async (id) => {
    if (!window.confirm("Delete this document?")) return;
    await api.delete(`/vault/${id}`);
    if (active?.id === id) setActive(null);
    load();
  };

  const download = (d) => {
    const blob = new Blob([d.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${d.title}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <RoomHeader
        kicker="Vault"
        title="Your saved work"
        sub="Brand kits, profiles, plans, and SOPs the agents made for you. Stored on this account, on this device."
        accent="#A78BFA" icon={VaultIcon}
      />

      <div className="grid lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-2">
          {docs.length === 0 && (
            <div className="card p-8 text-center text-slate-500">
              Nothing saved yet. Generate something in the rooms and click <b>Save to Vault</b>.
            </div>
          )}
          {docs.map((d) => (
            <button
              key={d.id}
              data-testid={`vault-item-${d.id}`}
              onClick={() => setActive(d)}
              className={`w-full text-left card p-4 transition ${active?.id === d.id ? "border-[#A78BFA]" : ""}`}
            >
              <div className="flex items-center gap-2">
                <div className="font-display text-base flex-1 truncate">{d.title}</div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{d.agent}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">{new Date(d.created_at).toLocaleString()}</div>
              <div className="text-xs text-slate-400 line-clamp-2 mt-2">{d.content.slice(0, 140)}…</div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {active ? (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye size={18} weight="duotone" className="text-[#A78BFA]" />
                <div className="font-display text-lg flex-1 truncate">{active.title}</div>
                <button data-testid={`vault-download-${active.id}`} onClick={() => download(active)} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                  <DownloadSimple size={14} /> Download
                </button>
                <button data-testid={`vault-delete-${active.id}`} onClick={() => remove(active.id)} className="text-slate-400 hover:text-[#EF4444] text-xs flex items-center gap-1">
                  <Trash size={14} /> Delete
                </button>
              </div>
              <div className="rounded-lg p-5 bg-[#0A0F1A]/60 border border-white/5 max-h-[70vh] overflow-y-auto">
                <Markdown>{active.content}</Markdown>
              </div>
            </div>
          ) : (
            <div className="card p-10 text-slate-500 text-center">
              Pick a document to view.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
