"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Tag } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import useSWR from "swr";

type Metrics = {
  totalMemories: number;
  memoriesByCategory: Record<string, number>;
  topTags: { tag: string; count: number }[];
  memoriesOverTime: { date: string; count: number }[];
  averageContentLength: number;
  totalTags: number;
};

const COLORS = [
  "#f97316",
  "#ea580c",
  "#dc2626",
  "#7c2d12",
  "#fed7aa",
  "#fdba74",
  "#fb923c",
];

export default function MetricsPage() {
  const fetcher = (url: string) => fetch(url).then((res) => res.json());
  const { data: metrics } = useSWR<Metrics>("/api/memories/metrics", fetcher);

  if (!metrics) {
    return (
      <section className="flex-1 p-4 lg:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  const categoryData = Object.entries(metrics.memoriesByCategory).map(
    ([category, count]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      count,
    })
  );

  const tagData = metrics.topTags.slice(0, 7).map((tag) => ({
    ...tag,
  }));

  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Memories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Memories
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMemories}</div>
            <p className="text-xs text-muted-foreground">Memories created</p>
          </CardContent>
        </Card>

        {/* Average Content Length */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Content Length
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageContentLength}
            </div>
            <p className="text-xs text-muted-foreground">
              Characters per memory
            </p>
          </CardContent>
        </Card>

        {/* Total Tags */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTags}</div>
            <p className="text-xs text-muted-foreground">Unique tags used</p>
          </CardContent>
        </Card>

        {/* Memories by Category */}
        <Card className="col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle>Memories by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tagData.map((tag, index) => {
                const maxCount = Math.max(...tagData.map((t) => t.count));
                const percentage = (tag.count / maxCount) * 100;

                return (
                  <div key={tag.tag} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {tag.tag}
                        </span>
                        <span className="text-sm text-gray-500">
                          {tag.count}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {tagData.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tags found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Memories Over Time */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Memories Created (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.memoriesOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#ea580c"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
