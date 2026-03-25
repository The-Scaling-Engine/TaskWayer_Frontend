import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      {/* Left: Search */}
      <div className="flex items-center gap-4 flex-1">
        <div className="hidden md:flex items-center gap-2 bg-muted rounded-xl px-4 py-2 max-w-sm w-full">
          <Search size={16} className="text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FE812C] rounded-full" />
        </button>

        {/* Create Task Button */}
        <Button className="bg-[#FE812C] hover:bg-[#e5732a] text-white rounded-xl shadow-md shadow-[#FE812C]/20 gap-2">
          <Plus size={18} />
          <span className="hidden sm:inline">Create Task</span>
        </Button>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
