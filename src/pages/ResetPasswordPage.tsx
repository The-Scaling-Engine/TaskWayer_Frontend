import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { Lock, Eye, EyeOff, CheckSquare, Briefcase, Lightbulb, Home, FolderKanban, ListTodo, FileText, Bot } from 'lucide-react';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

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
      const res = await authService.resetPassword(token, password);
      if (res.success && res.data.token) {
        // Backend auto-logs user in — save JWT and redirect to dashboard
        login(res.data.token, { _id: res.data.id, email: res.data.email });
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Password reset failed');
      } else {
        setError('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const honeycombItems = [
    { icon: ListTodo, label: 'Task', delay: '0s' },
    { icon: CheckSquare, label: 'Task', delay: '0.1s' },
    { icon: FileText, label: 'List', delay: '0.2s' },
    { icon: Briefcase, label: 'Work', delay: '0.3s' },
    { icon: FolderKanban, label: 'Projects', delay: '0.4s' },
    { icon: Home, label: 'Home', delay: '0.5s' },
    { icon: Lightbulb, label: 'Idea', delay: '0.6s' },
    { icon: ListTodo, label: 'Done', delay: '0.7s' },
    { icon: FolderKanban, label: 'Projects', delay: '0.8s' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel - Brand Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #F4DFDE 0%, #E5B7B9 40%, #BDCCCF 70%, #034D36 100%)'
        }}
      >
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-48 h-48 rounded-full bg-[#034D36]/20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 flex flex-col items-center px-12">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-[#034D36] rounded-xl flex items-center justify-center shadow-lg">
              <CheckSquare className="text-white" size={28} />
            </div>
            <span className="text-3xl font-bold text-[#034D36] tracking-tight">MicroDo</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {honeycombItems.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="group w-24 h-24 bg-white/30 backdrop-blur-sm border border-white/40 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/50 hover:scale-110 transition-all duration-300 cursor-pointer shadow-sm"
                  style={{
                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                    animationDelay: item.delay,
                  }}
                >
                  <Icon size={20} className="text-[#034D36] group-hover:text-[#10BA41] transition-colors" />
                  <span className="text-[10px] font-semibold text-[#034D36]/80">{item.label}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center">
            <div className="w-20 h-20 bg-[#034D36] rounded-full flex items-center justify-center shadow-xl">
              <Bot size={40} className="text-white hover:text-[#10BA41] transition-colors cursor-pointer" onClick={() => navigate('/')}/>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Reset Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden justify-center mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <CheckSquare className="text-primary-foreground" size={22} />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">MicroDo</span>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-foreground">Reset Password</h1>
            <p className="text-muted-foreground mt-2">Enter your new password below.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium text-foreground">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 rounded-xl"
                  autoComplete="new-password"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password" className="text-sm font-medium text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="confirm-new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl text-base font-semibold bg-[#FE812C] hover:bg-[#e5732a] text-white shadow-lg shadow-[#FE812C]/25 transition-all duration-200"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Back to Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
