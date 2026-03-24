import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Settings, LogOut, Plus } from 'lucide-react';

function Dashboard() {
  return (
    <div className="p-8">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">My Tasks</h1>
          <p className="text-slate-400">Welcome back! Here's what's on your list today.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:opacity-90 transition-all text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/20">
          <Plus size={20} />
          New Task
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass p-6 hover:translate-y-[-4px] transition-transform cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-secondary">Work</span>
              <CheckSquare size={18} className="text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Project Milestone {i}</h3>
            <p className="text-slate-400 text-sm mb-6">Complete the initial research and documentation for the core engine architecture.</p>
            <div className="flex items-center gap-2">
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-2/3 rounded-full" />
              </div>
              <span className="text-xs text-slate-500 font-medium">66%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-950 text-slate-50 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-white/5 bg-slate-900/50 p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <CheckSquare className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tighter">MicroDo</span>
          </div>

          <nav className="flex-1 space-y-2">
            <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 text-white font-medium transition-colors">
              <LayoutDashboard size={20} className="text-primary" />
              Dashboard
            </Link>
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <Settings size={20} />
              Settings
            </Link>
          </nav>

          <footer className="pt-6 border-t border-white/5">
            <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
              <LogOut size={20} />
              Sign Out
            </button>
          </footer>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<div className="p-8"><h1>Settings</h1></div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
