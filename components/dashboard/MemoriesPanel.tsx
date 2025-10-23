"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MemoriesPanel() {
  const { data, error } = useSWR("/api/memories", fetcher);

  if (error) return <div className="text-red-500">Failed to load memories</div>;
  if (!data) return <div>Loading memories...</div>;

  const grouped = data.grouped || {};

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h2 className="text-2xl font-bold mb-6">Your Memories</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.keys(grouped).length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No memories yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Start adding memories to see them here.
              </p>
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([category, items]: any) => (
          <Card key={category} className="mb-4">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {items.map((m: any) => (
                  <li key={m.id} className="border rounded p-3">
                    <div className="font-medium">{m.title || "Untitled"}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {m.content}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button size="sm" variant="ghost">
                        Open
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
