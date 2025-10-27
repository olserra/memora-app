"use client";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

type Props = {
  readonly memory?: any;
  readonly onClose: () => void;
  readonly onSaved: () => void;
};

export default function MemoryEditor({ memory, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(memory?.title || "");
  const [content, setContent] = useState(memory?.content || "");
  const [tagsStr, setTagsStr] = useState((memory?.tags || []).join(", "));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(memory?.title || "");
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

      const payload = { title, content, tags };
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
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!memory?.id) return;
    if (!confirm("Delete this memory?")) return;
    setSaving(true);
    try {
      await fetch(`/api/memories/${memory.id}`, { method: "DELETE" });
      onSaved();
      onClose();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSaving(false);
    }
  }
  // close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // prevent background scroll while modal is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev ?? "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      // close when clicking outside the dialog (overlay)
      onPointerDown={(e) => {
        // only close when the overlay itself was clicked (not children)
        if (e.currentTarget === e.target) {
          // prevent the click from propagating to elements underneath after unmount
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch {}
          // set a short-lived global flag to ignore the next click that might fall through
          try {
            // @ts-ignore - attach a small guard to globalThis
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
        className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 sm:mx-auto my-6 max-h-[calc(100vh-4rem)] overflow-auto"
        // prevent clicks inside the dialog from bubbling to the overlay
        onPointerDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold mb-4">
          {memory ? "Edit Memory" : "Create Memory"}
        </h3>
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded border px-3 py-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            className="w-full rounded border px-3 py-2 min-h-[240px]"
          />
          <input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="Tags (comma separated, max 3)"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500">
            {memory?.createdAt || memory?.created_at ? (
              <span>
                Created: {formatDate(memory?.createdAt ?? memory?.created_at)}
                {memory?.updatedAt || memory?.updated_at ? (
                  <span>
                    {" "}
                    · Updated:{" "}
                    {formatDate(memory?.updatedAt ?? memory?.updated_at)}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="italic text-gray-400">Not saved yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {memory && (
              <Button variant="ghost" onClick={remove} disabled={saving}>
                Delete
              </Button>
            )}
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
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
    return d.toLocaleString();
  } catch {
    return String(val);
  }
}
