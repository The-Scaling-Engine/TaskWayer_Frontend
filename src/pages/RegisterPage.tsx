import { useNavigate, Link } from 'react-router-dom';
import { CheckSquare } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background dark:bg-[#0d1611] text-foreground overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] max-w-[600px] max-h-[600px] opacity-80 dark:opacity-70"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 50%, transparent 70%)',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
            filter: 'blur(40px)',
          }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] opacity-70 dark:opacity-60"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 60%, transparent 70%)',
            borderRadius: '40% 60% 70% 30% / 50% 40% 60% 50%',
            filter: 'blur(50px)',
          }}
        />
      </div>

      <div className="absolute top-6 left-6 flex items-center gap-2.5 cursor-pointer z-50 group" onClick={() => navigate('/')}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/40 dark:bg-white/10 backdrop-blur-md border border-black/10 dark:border-white/20">
          <CheckSquare className="text-emerald-600 dark:text-emerald-400" size={18} />
        </div>
        <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">MicroDo</span>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-[420px] px-6">
        <div className="relative bg-white/60 dark:bg-black/30 backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_0_40px_rgba(16,186,65,0.15)] text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
            <CheckSquare className="text-amber-500" size={26} />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Registration Closed</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8">
            Self-registration is not available on this platform.<br />
            Contact an administrator to create an account for you.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full h-11 rounded-full font-semibold text-white text-sm
              bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-400
              hover:scale-[1.02] shadow-[0_4px_14px_rgba(16,186,65,0.2)]
              active:scale-[0.98] transition-all duration-300"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
