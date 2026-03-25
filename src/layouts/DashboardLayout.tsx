import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { cn } from '@/lib/utils';

export default function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => {
          // On mobile, toggle the mobile drawer
          if (window.innerWidth < 1024) {
            setMobileOpen(!mobileOpen);
          } else {
            setSidebarCollapsed(!sidebarCollapsed);
          }
        }}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        )}
      >
        <Topbar sidebarCollapsed={sidebarCollapsed} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
