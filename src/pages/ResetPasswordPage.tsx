import { useState, useEffect, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Lock, Eye, EyeOff, CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [done, setDone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const hashType = hashParams.get('type'); // 'recovery' | 'invite' | null

    // SDK may have already processed the hash before this effect ran
    if (hashType === 'recovery' || hashType === 'invite') {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
      // Invite links fire SIGNED_IN instead of PASSWORD_RECOVERY
      if (event === 'SIGNED_IN' && hashType === 'invite') {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
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
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);
      await supabase.auth.signOut();
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const backgroundBlobs = (
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
  );

  const pageShell = (children: React.ReactNode) => (
    <div className="relative min-h-screen flex items-center justify-center bg-background dark:bg-[#0d1611] text-foreground overflow-hidden transition-colors duration-300">
      {backgroundBlobs}

      <div
        className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer z-50 group"
        onClick={() => navigate('/')}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/40 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20 group-hover:bg-white/60 dark:group-hover:bg-white/20 transition-colors">
          <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">Wayer Ops</span>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6 animate-[fade-in-up_0.8s_ease-out_forwards]">
        <div className="relative bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_40px_rgba(16,186,65,0.15)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 dark:from-white/10 to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/30 dark:from-white/5 to-transparent pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
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
        .animate-float { animation: float 20s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 25s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 22s ease-in-out infinite 2s; }
      `}</style>
    </div>
  );

  if (done) {
    return pageShell(
      <>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-200 dark:via-green-400 dark:to-emerald-500">
              Done!
            </span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Your password has been updated. Please sign in with your new password.</p>
        </div>
        <Link
          to="/login"
          className="flex items-center justify-center w-full h-12 rounded-full font-bold text-white dark:text-black text-sm tracking-wide
            bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 dark:from-emerald-400 dark:via-green-400 dark:to-amber-200
            hover:scale-[1.02] shadow-[0_4px_14px_rgba(16,186,65,0.2)]
            active:scale-[0.98] transition-all duration-300"
        >
          Go to Login
        </Link>
      </>
    );
  }

  if (!sessionReady) {
    return pageShell(
      <>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-200 dark:via-green-400 dark:to-emerald-500">
              New Password
            </span>
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Verifying your reset link…</p>
        </div>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
            If this takes too long, your link may have expired.{' '}
            <Link to="/forgot-password" className="text-emerald-700 dark:text-emerald-400 underline">Request a new one.</Link>
          </p>
        </div>
      </>
    );
  }

  return pageShell(
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 dark:from-emerald-200 dark:via-green-400 dark:to-emerald-500">
            New Password
          </span>
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Enter your new password below.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-200 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide uppercase">New Password</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full h-12 pl-11 pr-11 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all duration-300 shadow-sm"
                required
                minLength={6}
                autoFocus
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
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 tracking-wide uppercase">Confirm Password</label>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-emerald-500/50 rounded-xl blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full h-12 pl-11 pr-11 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-emerald-400/50 focus:bg-white/80 dark:focus:bg-white/10 transition-all duration-300 shadow-sm"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-4 rounded-full font-bold text-white dark:text-black text-sm lg:text-base tracking-wide
            bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400 dark:from-emerald-400 dark:via-green-400 dark:to-amber-200
            hover:scale-[1.02] shadow-[0_4px_14px_rgba(16,186,65,0.2)] dark:hover:shadow-[0_0_20px_rgba(16,186,65,0.4)]
            active:scale-[0.98]
            transition-all duration-300 disabled:opacity-70 disabled:hover:scale-100"
        >
          {loading ? 'Saving…' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link to="/login" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors font-medium">
          Back to login
        </Link>
      </div>
    </>
  );
}
