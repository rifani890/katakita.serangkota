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
    onClick: () => void;
}

function StatCard({
    title,
    count,
    icon,
    colorClass,
    onClick,
}: StatCardProps) {
    const colorTheme: Record<string, { gradient: string, glow: string, text: string }> = {
        "bg-indigo-500": { gradient: "from-blue-500 to-indigo-600", glow: "shadow-blue-500/40", text: "text-blue-600 dark:text-blue-400" },
        "bg-teal-500": { gradient: "from-emerald-400 to-teal-500", glow: "shadow-emerald-500/40", text: "text-emerald-600 dark:text-emerald-400" },
        "bg-zinc-400": { gradient: "from-slate-400 to-slate-500", glow: "shadow-slate-500/40", text: "text-slate-600 dark:text-slate-400" },
        "bg-red-500": { gradient: "from-rose-500 to-red-600", glow: "shadow-rose-500/40", text: "text-rose-600 dark:text-rose-400" },
    };

    const theme = colorTheme[colorClass] || colorTheme["bg-zinc-400"];

    return (
        <div
            onClick={onClick}
            className="group relative overflow-hidden bg-white dark:bg-slate-800/60 rounded-[1.5rem] p-4 sm:p-5 cursor-pointer border border-slate-200/80 dark:border-slate-700/80 transition-all duration-500 hover:shadow-xl hover:shadow-slate-300/50 dark:hover:shadow-black/50 hover:-translate-y-1 backdrop-blur-xl"
        >
            {/* Subtle Gradient Overlay on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`} />

            {/* Content Container */}
            <div className="relative z-10 flex items-center gap-4 sm:gap-5">
                
                {/* Icon */}
                <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-2xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-white shadow-lg ${theme.glow} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <i className={`fas ${icon} text-xl sm:text-2xl`}></i>
                </div>
                
                {/* Values */}
                <div className="flex-1 min-w-0">
                    <p className={`text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 truncate ${theme.text}`}>
                        {title}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-none">
                        {count.toLocaleString()}
                    </h3>
                </div>
                
                {/* Arrow indicator */}
                <div className={`hidden sm:flex w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/50 items-center justify-center opacity-0 group-hover:opacity-100 transform -translate-x-2 transition-all duration-500`}>
                    <i className={`fas fa-chevron-right text-[10px] ${theme.text}`}></i>
                </div>
            </div>
            
            {/* Decorative Glow Blob */}
            <div className={`absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br ${theme.gradient} blur-[50px] opacity-[0.08] dark:opacity-[0.15] group-hover:opacity-[0.2] dark:group-hover:opacity-[0.3] transition-opacity duration-700 rounded-full pointer-events-none`} />
        </div>
    );
}

function SkeletonCard({ colorClass }: { colorClass: string }) {
    return (
        <div
            className={`bg-slate-200 dark:bg-slate-800 rounded-[1.5rem] border border-slate-300 dark:border-slate-600 p-5 h-24 sm:h-28 animate-pulse`}
        />
    );
}

export default function StatCards({ stats, loading, onFilter }: StatCardsProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                <SkeletonCard colorClass="bg-indigo-500" />
                <SkeletonCard colorClass="bg-zinc-400" />
                <SkeletonCard colorClass="bg-teal-500" />
                <SkeletonCard colorClass="bg-red-500" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
            <StatCard
                title="Total Berita"
                count={stats.total}
                icon="fa-globe"
                colorClass="bg-indigo-500"
                onClick={() => onFilter("total")}
            />
            <StatCard
                title="Netral"
                count={stats.neutral}
                icon="fa-meh"
                colorClass="bg-zinc-400"
                onClick={() => onFilter("neutral")}
            />
            <StatCard
                title="Positif"
                count={stats.positive}
                icon="fa-smile"
                colorClass="bg-teal-500"
                onClick={() => onFilter("positive")}
            />
            <StatCard
                title="Negatif"
                count={stats.negative}
                icon="fa-frown"
                colorClass="bg-red-500"
                onClick={() => onFilter("negative")}
            />
        </div>
    );
}
