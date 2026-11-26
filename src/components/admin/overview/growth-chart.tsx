"use client";
// "Growth Trajectory": enquiries per day (7/30 days) or per week (90 days).
// One series, so no legend: the card title names it. Hover tooltip on every bar,
// and a table view for screen readers and anyone who prefers numbers.
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Bucket, Range } from "@/lib/overview";

const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const weekday = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", timeZone: "UTC" });
const fmt = (iso: string, f: Intl.DateTimeFormat) => f.format(new Date(`${iso}T00:00:00Z`));

function bucketLabel(b: Bucket, range: Range) {
  if (range === 90) return `${fmt(b.start, day)} – ${fmt(b.end, day)}`;
  return fmt(b.start, range === 7 ? weekday : day);
}

export function GrowthChart({ buckets, range }: { buckets: Bucket[]; range: Range }) {
  const data = buckets.map((b) => ({ ...b, label: bucketLabel(b, range), tick: fmt(b.start, range === 7 ? weekday : day) }));
  const total = buckets.reduce((s, b) => s + b.total, 0);
  const unit = range === 90 ? "week" : "day";

  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        <span className="text-2xl font-semibold text-fg tabular-nums">{total}</span>{" "}
        {total === 1 ? "enquiry" : "enquiries"} in the last {range} days
      </p>
      <div className="h-60 text-chart" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={2}>
            <CartesianGrid vertical={false} stroke="var(--c-border)" strokeWidth={1} />
            <XAxis
              dataKey="tick"
              tickLine={false}
              axisLine={{ stroke: "var(--c-border)" }}
              tick={{ fill: "var(--c-muted)", fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--c-muted)", fontSize: 11 }}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "var(--c-subtle)" }}
              content={({ active, payload }) => {
                const p = active && payload?.[0] ? (payload[0].payload as (typeof data)[number]) : null;
                if (!p) return null;
                return (
                  <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
                    <p className="text-muted">{p.label}</p>
                    <p className="font-semibold text-fg tabular-nums">
                      {p.total} {p.total === 1 ? "enquiry" : "enquiries"}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="total" fill="currentColor" radius={[4, 4, 0, 0]} maxBarSize={24} minPointSize={0} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-muted hover:text-fg">View as table</summary>
        <table className="mt-2 w-full text-left">
          <caption className="sr-only">Enquiries per {unit}, last {range} days</caption>
          <thead className="text-xs text-muted">
            <tr><th scope="col" className="py-1 font-medium">{range === 90 ? "Week" : "Day"}</th><th scope="col" className="py-1 text-right font-medium">Enquiries</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((d) => (
              <tr key={d.start}><td className="py-1">{d.label}</td><td className="py-1 text-right tabular-nums">{d.total}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
