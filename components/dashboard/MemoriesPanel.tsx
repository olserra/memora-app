"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  Calendar,
  FileText,
  Grid3X3,
  List,
  Plus,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import MemoryEditor from "./MemoryEditor";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function MemoryTag({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-lg font-medium">
      {children}
    </span>
  );
}

function renderShortDate(dateVal: any) {
  try {
    const d = new Date(dateVal);
    if (Number.isNaN(d.getTime())) return String(dateVal || "");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return String(dateVal || "");
  }
}

export default function MemoriesPanel() {
  const { data, error, mutate } = useSWR("/api/memories", fetcher);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const items: any[] = data?.items || [];

  const tags = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) for (const t of it.tags || []) s.add(t);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (activeTag && !(m.tags || []).includes(activeTag)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          (m.title || "").toLowerCase().includes(q) ||
          (m.content || "").toLowerCase().includes(q) ||
          (m.tags || []).join(" ").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, activeTag, query]);

  if (error)
    return <div className="text-red-500 p-4">Failed to load memories</div>;
  if (!data)
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-8 h-8 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading your memories...</p>
        </div>
      </div>
    );

  return (
    <section className="max-w-7xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex-1 max-w-2xl relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-sm"
          />
        </div>

        <div className="flex items-center gap-2 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setView(view === "grid" ? "list" : "grid")}
            className="hidden sm:flex"
          >
            {view === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid3X3 className="h-4 w-4" />
            )}
          </Button>

          <Button
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New</span>
          </Button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => setActiveTag(null)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0 font-medium ${
              activeTag === null
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0 font-medium ${
                activeTag === t
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-xs px-2 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 flex-shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No memories found
            </h3>
            <p className="text-sm text-gray-500">
              {query || activeTag
                ? "Try adjusting your filters"
                : "Start by creating your first memory"}
            </p>
          </CardContent>
        </Card>
      )}

      {filtered.length > 0 && view === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card
              key={m.id}
              className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm hover:scale-[1.02] group h-full"
              onClick={() => {
                if ((globalThis as any).__memora_ignore_next_click) return;
                setEditing(m);
                setEditorOpen(true);
              }}
            >
              <CardContent className="p-5 flex flex-col h-full">
                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed pb-2">
                  {m.content}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
                  <div className="flex flex-wrap gap-1.5">
                    {(m.tags || []).slice(0, 2).map((t: string) => (
                      <MemoryTag key={t}>{t}</MemoryTag>
                    ))}
                    {(m.tags || []).length > 2 && (
                      <span className="text-xs text-gray-400 px-2 py-1">
                        +{(m.tags || []).length - 2}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    {renderShortDate(m.createdAt ?? m.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > 0 && view !== "grid" && (
        <div className="space-y-2">
          {filtered.map((m) => (
            <button
              key={m.id}
              className="w-full text-left p-4 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200 group"
              onClick={() => {
                if ((globalThis as any).__memora_ignore_next_click) return;
                setEditing(m);
                setEditorOpen(true);
              }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <FileText className="w-5 h-5 text-orange-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {m.category && m.category !== "general" && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium flex-shrink-0">
                        {m.category}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">
                    {m.content}
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {(m.tags || []).slice(0, 3).map((t: string) => (
                        <MemoryTag key={t}>{t}</MemoryTag>
                      ))}
                      {(m.tags || []).length > 3 && (
                        <span className="text-xs text-gray-400 px-2 py-1">
                          +{(m.tags || []).length - 3}
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-400 flex items-center gap-1 ml-auto flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                      {renderShortDate(m.createdAt ?? m.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {editorOpen && (
        <MemoryEditor
          memory={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => mutate()}
        />
      )}
    </section>
  );
}
