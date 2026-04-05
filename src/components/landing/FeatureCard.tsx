import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <div className="group relative p-6 rounded-2xl overflow-hidden
      border border-white/15 dark:border-white/10
      bg-white/50 dark:bg-white/[0.04]
      backdrop-blur-xl
      shadow-sm
      hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-400/10
      hover:border-emerald-500/30 dark:hover:border-emerald-400/25
      transition-all duration-300"
    >
      {/* Subtle inner glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Neon border glow on hover (bottom edge) */}
      <div className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* Icon */}
        <div className="w-12 h-12 mb-5 rounded-xl
          bg-white/60 dark:bg-white/[0.08]
          border border-white/30 dark:border-white/10
          flex items-center justify-center
          group-hover:border-emerald-500/30 dark:group-hover:border-emerald-400/20
          group-hover:shadow-md group-hover:shadow-emerald-500/10 dark:group-hover:shadow-emerald-400/10
          transition-all duration-300"
        >
          <Icon size={22} className="text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
