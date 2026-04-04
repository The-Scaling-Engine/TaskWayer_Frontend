import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { Mail, CheckSquare, Briefcase, Lightbulb, Home, FolderKanban, ListTodo, FileText, Bot, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setSuccess(res.message || 'Password reset link has been sent to your email. Please check your inbox.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Failed to send reset email');
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

      {/* Right Panel - Forgot Password Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden justify-center mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <CheckSquare className="text-primary-foreground" size={22} />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">MicroDo</span>
          </div>

          {/* Back to Login */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>

          <div>
            <h1 className="text-4xl font-bold text-foreground">Forgot Password</h1>
            <p className="text-muted-foreground mt-2">
              Enter your email and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-600 rounded-xl px-4 py-3 text-sm font-medium">
              {success}
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-sm font-medium text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 rounded-xl"
                    autoComplete="email"
                    autoFocus
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
                    Sending...
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Button
                asChild
                className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-all duration-200"
              >
                <Link to="/login">Return to Login</Link>
              </Button>
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
