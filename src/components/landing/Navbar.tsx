import { Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  return (
    <header className="fixed top-0 w-full z-50 px-4 sm:px-6 pt-4 sm:pt-6">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 py-3 rounded-2xl
        border border-white/20 dark:border-white/10
        bg-white/70 dark:bg-white/5
        backdrop-blur-2xl
        shadow-lg shadow-black/5 dark:shadow-black/30"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 border border-emerald-500/40 dark:border-emerald-400/40 rounded-lg flex items-center justify-center bg-emerald-500/10 dark:bg-emerald-400/10">
            <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">MicroDo</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            to="/login"
            className="hidden sm:inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold
              border border-foreground/20 dark:border-white/20
              text-foreground
              hover:bg-white/10 dark:hover:bg-white/10
              transition-all duration-200"
          >
            Log In
          </Link>

          <Link
            to="/register"
            className="inline-flex items-center px-5 py-2 rounded-xl text-sm font-semibold
              border border-foreground/20 dark:border-white/20
              text-foreground
              hover:bg-emerald-500/10 dark:hover:bg-emerald-400/10 hover:border-emerald-500/40 dark:hover:border-emerald-400/40
              transition-all duration-200"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}
