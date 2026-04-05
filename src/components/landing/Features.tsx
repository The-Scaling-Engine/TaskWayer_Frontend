import { LayoutDashboard, Clock, Users, Zap, Shield, Sparkles } from 'lucide-react';
import FeatureCard from './FeatureCard';

const primaryFeatures = [
  {
    icon: LayoutDashboard,
    title: 'Intuitive Kanban Boards',
    description: 'Intuitive kanban boards for task sorting, management, and creation. Track and organize all your work visually.',
  },
  {
    icon: Clock,
    title: 'Smart Time Tracking',
    description: 'Activate time tracking and get real-time insights. Monitor hours for all your tasks and improve efficiency.',
  },
  {
    icon: Users,
    title: 'Seamless Collaboration',
    description: 'Collaborate with your team in real-time. Assign tasks, share updates, and keep everyone in sync.',
  },
];

const secondaryFeatures = [
  { icon: Zap, title: 'Lightning Fast' },
  { icon: Shield, title: 'Bank-grade Security' },
  { icon: Sparkles, title: 'Beautiful Design' },
];

export default function Features() {
  return (
    <section className="relative py-16 sm:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Primary Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {primaryFeatures.map((feature, idx) => (
            <FeatureCard key={idx} {...feature} />
          ))}
        </div>

        {/* Secondary Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {secondaryFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl
                border border-white/15 dark:border-white/10
                bg-white/40 dark:bg-white/[0.04]
                backdrop-blur-xl
                hover:border-emerald-500/25 dark:hover:border-emerald-400/20
                hover:shadow-md hover:shadow-emerald-500/5 dark:hover:shadow-emerald-400/5
                transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl
                bg-white/60 dark:bg-white/[0.08]
                border border-white/30 dark:border-white/10
                flex items-center justify-center shrink-0
                group-hover:border-emerald-500/30 dark:group-hover:border-emerald-400/20
                transition-all duration-300"
              >
                <feature.icon size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="font-bold text-foreground text-sm">{feature.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
