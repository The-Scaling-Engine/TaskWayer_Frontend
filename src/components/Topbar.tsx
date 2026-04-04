import { useAuthStore } from '@/store/authStore';

import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ThemeToggle';

interface TopbarProps {
  sidebarCollapsed: boolean;
}

export default function Topbar({ sidebarCollapsed }: TopbarProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 transition-all duration-300',
        sidebarCollapsed ? 'lg:pl-6' : 'lg:pl-6'
      )}
    >
      {/* Left: Empty flex space */}
      <div className="flex items-center gap-4 flex-1" />

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle />



        {/* User Avatar */}
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user?.name || user?.email || 'User'}
            className="w-9 h-9 rounded-full object-cover ml-1"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold ml-1">
            {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </header>
  );
}
