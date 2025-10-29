"use client";
import { Button } from "@/components/ui/button";
import { Calendar, Save, Tag, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  readonly memory?: any;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export default function MemoryEditor({ memory, onClose, onSaved }: Props) {
  const [content, setContent] = useState(memory?.content || "");
  const [tagsStr, setTagsStr] = useState((memory?.tags || []).join(", "));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContent(memory?.content || "");
    setTagsStr((memory?.tags || []).join(", "));
  }, [memory]);

  async function save() {
    setSaving(true);
    try {
      const tags = tagsStr
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
        .slice(0, 3);

      const payload = { content, tags };
      if (memory?.id) {
        await fetch(`/api/memories/${memory.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`/api/memories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !memory?.id ||
      typeof memory.id !== "number" ||
      Number.isNaN(memory.id) ||
      memory.id <= 0
    )
      return;
    if (!confirm("Delete this memory? This action cannot be undone.")) return;
    setSaving(true);
    try {
      await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") save();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, content, tagsStr]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev ?? "";
    };
  }, []);

  const tagList = tagsStr
    .split(",")
    .map((t: string) => t.trim())
    .filter(Boolean);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 animate-in fade-in duration-200"
      onPointerDown={(e) => {
        if (e.currentTarget === e.target) {
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch {}
          try {
            (globalThis as any).__memora_ignore_next_click = true;
            setTimeout(() => {
              (globalThis as any).__memora_ignore_next_click = false;
            }, 50);
          } catch {}
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl sm:mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 mb-4 sm:mb-0"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            {memory ? "Edit Memory" : "New Memory"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What do you want to remember?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-base resize-none"
              rows={8}
              disabled={saving}
            />
          </div>

          <div>
            <label
              htmlFor="tags"
              className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2"
            >
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <input
              id="tags"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="work, ideas, personal (max 3, comma separated)"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all text-base"
              disabled={saving}
            />
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {tagList.slice(0, 3).map((tag: string, i: number) => (
                  <span
                    key={tag}
                    className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-medium"
                  >
                    {tag}
                  </span>
                ))}
                {tagList.length > 3 && (
                  <span className="text-xs text-gray-500 px-3 py-1.5">
                    +{tagList.length - 3} more (only first 3 will be saved)
                  </span>
                )}
              </div>
            )}
          </div>

          {(memory?.createdAt || memory?.created_at) && (
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>
                  Created {formatDate(memory?.createdAt ?? memory?.created_at)}
                  {memory?.updatedAt || memory?.updated_at ? (
                    <span className="ml-2">
                      · Updated{" "}
                      {formatDate(memory?.updatedAt ?? memory?.updated_at)}
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
          {memory ? (
            <Button
              variant="ghost"
              onClick={remove}
              disabled={saving}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={saving}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="px-6 pb-4 text-xs text-gray-400 text-center">
          Press{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
            Esc
          </kbd>{" "}
          to cancel ·{" "}
          <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-600">
            ⌘ Enter
          </kbd>{" "}
          to save
        </div>
      </div>
    </div>
  );
}

function formatDate(val: any) {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(val);
  }
}
