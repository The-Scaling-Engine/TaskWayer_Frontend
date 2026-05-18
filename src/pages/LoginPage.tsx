import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Mail, Lock, Eye, EyeOff, CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Keep if we want users to toggle, though cursorrule says top-left logo. Let's put theme toggle top-right.

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const { token, user } = await authService.login(email, password);
      login(token, user);
      const pendingInvitation = sessionStorage.getItem('pending_invitation');
      if (pendingInvitation) {
        sessionStorage.removeItem('pending_invitation');
        navigate(pendingInvitation);
      } else if (user.role === 'ADMIN') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background dark:bg-[#0d1611] text-foreground overflow-hidden transition-colors duration-300">
      
      {/* Background Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] opacity-80 dark:opacity-70 animate-float-slow"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 50%, transparent 70%)',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
            filter: 'blur(40px)',
          }}
        />
        <div 
          className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] opacity-70 dark:opacity-60 animate-float-delayed"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 60%, transparent 70%)',
            borderRadius: '40% 60% 70% 30% / 50% 40% 60% 50%',
            filter: 'blur(50px)',
          }}
        />
        <div 
          className="absolute top-[20%] right-[20%] w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] opacity-90 dark:opacity-80 animate-float"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #84cc16 0%, #10BA41 50%, transparent 70%)',
            borderRadius: '50% 50% 40% 60% / 60% 40% 50% 50%',
            filter: 'blur(30px)',
          }}
        />
      </div>

      {/* Top Left Logo */}
      <div 
        className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer z-50 group"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/40 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 group-hover:bg-white/60 dark:group-hover:bg-white/20 transition-colors">
          <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">MicroDo</span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Centered Form Card */}
      <div className="relative z-10 w-full max-w-[420px] px-6 animate-[fade-in-up_0.8s_ease-out_forwards]">
        <div className="relative bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_40px_rgba(16,186,65,0.15)] overflow-hidden">
          
          {/* Card Inner Glow & Reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-amber-200 dark:via-yellow-400 dark:to-amber-500">
                  Login
                </span>
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Welcome back! Sign in to continue.</p>
            </div>

            {/* Error handling */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-200 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide uppercase">Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full h-12 pl-11 pr-4 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all duration-300 shadow-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-12 pl-11 pr-11 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all duration-300 shadow-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                  <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-sm text-emerald-700 hover:text-emerald-800 dark:text-amber-300 dark:hover:text-amber-200 font-medium transition-colors">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 rounded-full font-bold text-white dark:text-black text-sm lg:text-base tracking-wide
                  bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 dark:from-emerald-400 dark:via-green-400 dark:to-amber-200
                  hover:scale-[1.02] shadow-[0_4px_14px_rgba(16,186,65,0.2)] dark:hover:shadow-[0_0_20px_rgba(16,186,65,0.4)]
                  active:scale-[0.98]
                  transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? 'Signing in...' : 'Log In'}
              </button>

            </form>

            
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
          33% { transform: translate(30px, -50px) scale(1.1) rotate(5deg); }
          66% { transform: translate(-20px, 20px) scale(0.9) rotate(-5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(1.05); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -40px) scale(0.95); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 25s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 22s ease-in-out infinite 2s;
        }
      `}</style>
    </div>
  );
}
