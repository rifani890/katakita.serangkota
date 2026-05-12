"use client";

interface StatCardsProps {
  stats: {
    total: number;
    positive: number;
    neutral: number;
    negative: number;
  };
  loading: boolean;
  onFilter: (type: "total" | "positive" | "neutral" | "negative") => void;
}

interface StatCardProps {
  title: string;
  count: number;
  icon: string;
  colorClass: string;
  borderClass: string;
  hoverClass: string;
  textClass: string;
  onClick: () => void;
}

function StatCard({
  title,
  count,
  icon,
  colorClass,
  borderClass,
  hoverClass,
  textClass,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 transition-all border-l-4 ${borderClass} cursor-pointer ${hoverClass} hover:shadow-md hover:-translate-y-1 ${textClass}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 ${colorClass} bg-opacity-10 rounded-xl text-xl sm:text-2xl ${colorClass.replace("bg-", "text-")}`}
        >
          <i className={`fas ${icon}`}></i>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold">{count.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ borderClass }: { borderClass: string }) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-800 rounded-xl border border-slate-300 dark:border-slate-600 p-5 h-24 animate-pulse border-l-4 ${borderClass}`}
    />
  );
}

export default function StatCards({ stats, loading, onFilter }: StatCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SkeletonCard borderClass="border-l-indigo-500" />
        <SkeletonCard borderClass="border-l-teal-500" />
        <SkeletonCard borderClass="border-l-zinc-400" />
        <SkeletonCard borderClass="border-l-red-500" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        title="Total Berita"
        count={stats.total}
        icon="fa-globe"
        colorClass="bg-indigo-500"
        borderClass="border-l-indigo-500"
        hoverClass="hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
        textClass="text-indigo-600 dark:text-indigo-400"
        onClick={() => onFilter("total")}
      />
      <StatCard
        title="Positif"
        count={stats.positive}
        icon="fa-smile"
        colorClass="bg-teal-500"
        borderClass="border-l-teal-500"
        hoverClass="hover:bg-teal-50 dark:hover:bg-teal-950/20"
        textClass="text-teal-600 dark:text-teal-400"
        onClick={() => onFilter("positive")}
      />
      <StatCard
        title="Netral"
        count={stats.neutral}
        icon="fa-meh"
        colorClass="bg-zinc-400"
        borderClass="border-l-zinc-400"
        hoverClass="hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
        textClass="text-zinc-600 dark:text-zinc-300"
        onClick={() => onFilter("neutral")}
      />
      <StatCard
        title="Negatif"
        count={stats.negative}
        icon="fa-frown"
        colorClass="bg-red-500"
        borderClass="border-l-red-500"
        hoverClass="hover:bg-red-50 dark:hover:bg-red-950/20"
        textClass="text-red-600 dark:text-red-400"
        onClick={() => onFilter("negative")}
      />
    </div>
  );
}
