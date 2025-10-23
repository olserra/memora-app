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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
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
            className="w-full rounded border px-3 py-2 min-h-[120px]"
          />
          <input
            value={tagsStr}
            onChange={(e) => setTagsStr(e.target.value)}
            placeholder="Tags (comma separated, max 3)"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
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
  );
}
