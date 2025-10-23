"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Search } from "lucide-react";
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

export default function MemoriesPanel() {
  const { data, error } = useSWR("/api/memories", fetcher);
  const { mutate } = useSWR("/api/memories", fetcher);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  // ensure hooks (useMemo) are called before any early returns
  // create a stable items array even if data is not yet present
  const items: any[] = data?.items || [];

  const tags = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) {
      const its = it.tags || [];
      for (const t of its) {
        s.add(t);
      }
    }
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Memories</h2>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Memory
          </Button>
          <div className="flex items-center border rounded-md px-3 py-1 gap-2 bg-white">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memories, tags or content"
              className="outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              onClick={() => setView("grid")}
            >
              Grid
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              onClick={() => setView("list")}
            >
              List
            </Button>
          </div>
        </div>
      </div>

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

      {(() => {
        if (filtered.length === 0) {
          return (
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
          );
        }

        if (view === "grid") {
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((m: any) => (
                <Card key={m.id} className="hover:shadow-md transition">
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(m);
                          setEditorOpen(true);
                        }}
                      >
                        Open
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          );
        }

        return (
          <div className="space-y-3">
            {filtered.map((m: any) => (
              <Card key={m.id} className="p-0">
                <CardContent className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.title || "Untitled"}</div>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {m.content}
                    </div>
                    <div className="mt-2">
                      {(m.tags || []).map((t: string) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditing(m);
                        setEditorOpen(true);
                      }}
                    >
                      Open
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}
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
