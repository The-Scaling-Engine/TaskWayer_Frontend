import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Mail, Lock, Eye, EyeOff, CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle'; // Kept for consistency

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register({ email, password });
      if (res.success) {
        setSuccess('Account created successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Registration failed');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#0d1611] text-foreground overflow-hidden">
      
      {/* Background Floating Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] opacity-70 animate-float-slow"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 50%, transparent 70%)',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
            filter: 'blur(40px)',
          }}
        />
        <div 
          className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] opacity-60 animate-float-delayed"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 60%, transparent 70%)',
            borderRadius: '40% 60% 70% 30% / 50% 40% 60% 50%',
            filter: 'blur(50px)',
          }}
        />
        <div 
          className="absolute top-[20%] right-[20%] w-[20vw] h-[20vw] max-w-[300px] max-h-[300px] opacity-80 animate-float"
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-white/20 transition-colors">
          <CheckSquare className="text-emerald-400" size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">MicroDo</span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Centered Form Card */}
      <div className="relative z-10 w-full max-w-[420px] px-6 animate-float-card">
        <div className="relative bg-white/10 dark:bg-black/30 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 lg:p-10 shadow-[0_0_40px_rgba(16,186,65,0.15)] overflow-hidden">
          
          {/* Card Inner Glow & Reflection */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-green-400 to-emerald-500">
                  Register
                </span>
              </h1>
              <p className="text-sm text-zinc-300">Create your new account to continue.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-200 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 rounded-xl px-4 py-3 text-sm">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">Email</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full h-12 pl-11 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full h-12 pl-11 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all duration-300"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 tracking-wide uppercase">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password"
                      className="w-full h-12 pl-11 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/10 transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-4 rounded-full font-bold text-black text-sm lg:text-base tracking-wide
                  bg-gradient-to-r from-emerald-400 via-green-400 to-amber-200
                  hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(16,186,65,0.4)]
                  active:scale-[0.98]
                  transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>

            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-zinc-400">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200 font-semibold transition-colors">
                  Log in
                </Link>
              </p>
            </div>
            
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
        @keyframes float-card {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
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
        .animate-float-card {
          animation: float-card 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
