"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, FileText, Grid3X3, List, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import MemoryEditor from "./MemoryEditor";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Tag({ children }: { readonly children: React.ReactNode }) {
  return (
    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md mr-2">
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
    for (const it of items) (it.tags || []).forEach((t: string) => s.add(t));
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

  if (error) return <div className="text-red-500">Failed to load memories</div>;
  if (!data) return <div>Loading memories...</div>;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header: search + view controls */}
      <div className="w-full mb-6">
        <div className="flex items-center gap-3 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center border rounded-lg px-3 py-2 gap-2 bg-white w-full max-w-3xl">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories, tags or content"
              className="outline-none text-base flex-1 py-0"
            />
            <Button
              variant="ghost"
              className="md:hidden p-1"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
              aria-label="New memory"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              className="hidden md:inline-flex"
              onClick={() => {
                setEditing(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> New Memory
            </Button>

            <div className="hidden md:flex items-center gap-2">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tag filter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTag(null)}
            className={`text-sm px-2 py-1 rounded-md ${
              activeTag ? "bg-white" : "bg-gray-100"
            }`}
          >
            All
          </button>
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(t)}
              className={`text-sm px-2 py-1 rounded-md ${
                activeTag === t ? "bg-gray-200" : "bg-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Memory list */}
      {filtered.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No memories found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Try another search or add a new memory from chat.
            </p>
          </CardContent>
        </Card>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((m) => (
            <Card
              key={m.id}
              className="hover:shadow-md transition cursor-pointer"
              tabIndex={0}
              onClick={() => {
                if ((globalThis as any).__memora_ignore_next_click) return;
                setEditing(m);
                setEditorOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if ((globalThis as any).__memora_ignore_next_click) return;
                  setEditing(m);
                  setEditorOpen(true);
                }
              }}
            >
              <CardHeader>
                <CardTitle className="truncate">
                  {m.title || "Untitled"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-4">
                  {m.content}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div>
                  {(m.tags || []).slice(0, 3).map((t: string) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <time dateTime={m.createdAt || m.created_at || ""}>
                    {renderShortDate(m.createdAt ?? m.created_at)}
                  </time>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((m) => (
            <button
              key={m.id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 w-full text-left"
              onClick={() => {
                if ((globalThis as any).__memora_ignore_next_click) return;
                setEditing(m);
                setEditorOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  if ((globalThis as any).__memora_ignore_next_click) return;
                  setEditing(m);
                  setEditorOpen(true);
                }
              }}
            >
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center">
                  <FileText className="w-3 h-3 text-gray-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate flex-shrink-0 max-w-xs">
                    {m.title || "Untitled"}
                  </h3>
                  <p className="text-gray-700 truncate flex-1 text-sm leading-tight">
                    {m.content}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(m.tags || []).slice(0, 3).map((t: string) => (
                      <span
                        key={t}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                      >
                        {t}
                      </span>
                    ))}
                    {(m.tags || []).length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{(m.tags || []).length - 3}
                      </span>
                    )}
                  </div>
                  {m.category && m.category !== "general" && (
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium flex-shrink-0">
                      {m.category}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <time dateTime={m.createdAt || m.created_at || ""}>
                      {renderShortDate(m.createdAt ?? m.created_at)}
                    </time>
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
