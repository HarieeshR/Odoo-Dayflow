import { useEffect, useMemo, useState } from "react";
import { Search, ScrollText, ChevronDown } from "lucide-react";
import * as api from "../services/api";
import { EmptyState, ErrorState, TableSkeleton } from "../components/ui";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [openId, setOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await api.getPolicies();
      setPolicies(list);
    } catch (e) {
      setError(e.message || "Unable to load policies.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => ["All", ...new Set(policies.map((p) => p.category))], [policies]);

  const filtered = policies.filter((p) => {
    const matchesQuery =
      !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.summary.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search policies…"
            className="w-full rounded-xl border border-navy-900/10 bg-surface pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-400/50"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                category === c ? "bg-brand-900 text-white" : "bg-surface border border-navy-900/10 text-navy-600 hover:bg-navy-900/[0.03]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card"><TableSkeleton rows={5} cols={1} /></div>
      ) : filtered.length === 0 ? (
        <div className="card"><EmptyState icon={ScrollText} title="No policies match your search." /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const open = openId === p.id;
            return (
              <div key={p.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center shrink-0">
                    <ScrollText size={17} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-navy-900">{p.title}</p>
                      <span className="text-[11px] font-semibold text-navy-500 bg-navy-900/[0.05] px-2 py-0.5 rounded-full">{p.category}</span>
                    </div>
                    <p className="text-sm text-navy-500 mt-0.5">{p.summary}</p>
                  </div>
                  <ChevronDown size={17} className={`text-navy-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="px-5 pb-5 pl-[74px]">
                    <p className="text-sm text-navy-600 leading-relaxed border-t border-navy-900/[0.06] pt-4">{p.body}</p>
                    <p className="text-xs text-navy-400 mt-3">Last updated {p.updated}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
