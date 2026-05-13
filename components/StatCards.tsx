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
 // Map color classes to gradient definitions
 const gradientMap: Record<string, string> = {
 "border-l-indigo-500": "from-indigo-500 to-blue-600",
 "border-l-teal-500": "from-teal-400 to-emerald-600",
 "border-l-zinc-400": "from-slate-400 to-slate-500",
 "border-l-red-500": "from-rose-500 to-red-600",
 };

 const bgGradientMap: Record<string, string> = {
 "border-l-indigo-500": "from-indigo-50/50 via-transparent to-transparent dark:from-indigo-900/10",
 "border-l-teal-500": "from-teal-50/50 via-transparent to-transparent dark:from-teal-900/10",
 "border-l-zinc-400": "from-slate-50/50 via-transparent to-transparent dark:from-slate-800/10",
 "border-l-red-500": "from-rose-50/50 via-transparent to-transparent dark:from-rose-900/10",
 };

 const gradient = gradientMap[borderClass] || "from-slate-400 to-slate-500";
 const bgGradient = bgGradientMap[borderClass] || "from-slate-50/50 via-transparent to-transparent dark:from-slate-800/10";

 return (
 <div
 onClick={onClick}
 className={`bg-white dark:bg-dark-card rounded-xl shadow-sm border border-slate-300 dark:border-slate-600 p-4 sm:p-5 transition-all cursor-pointer relative overflow-hidden group hover:shadow-md hover:-translate-y-1 ${textClass}`}
 >
 {/* Background Gradient Fade */}
 <div className={`absolute inset-0 bg-gradient-to-r ${bgGradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

 {/* Vertical Gradient Accent Bar */}
 <div className={`absolute left-0 top-0 bottom-0 w-[5px] bg-gradient-to-b ${gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />

 <div className="flex items-center gap-4 relative z-10">
 <div
 className={`p-3 ${colorClass} bg-opacity-10 rounded-xl text-xl sm:text-2xl ${colorClass.replace("bg-", "text-")}`}
 >
 <i className={`fas ${icon}`}></i>
 </div>
 <div>
 <p className="text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400">
 {title}
 </p>
 <p className="text-2xl sm:text-3xl font-black">{count.toLocaleString()}</p>
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
