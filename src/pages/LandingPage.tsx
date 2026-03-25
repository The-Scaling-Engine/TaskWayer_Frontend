import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowRight, LayoutDashboard, Clock, Users, Zap, Shield, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const slides = [
  {
    title: 'Intuitive Kanban Boards',
    description: 'Visualize your work. Move tasks from To Do to Done with ease.',
    icon: LayoutDashboard,
    imagePlaceholder: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20',
    color: 'text-blue-500'
  },
  {
    title: 'Smart Time Tracking',
    description: 'Keep track of every minute spent on your projects effortlessly.',
    icon: Clock,
    imagePlaceholder: 'bg-gradient-to-br from-[#FE812C]/20 to-[#e5732a]/20',
    color: 'text-[#FE812C]'
  },
  {
    title: 'Seamless Collaboration',
    description: 'Work together with your team in real-time. No silos, just synergy.',
    icon: Users,
    imagePlaceholder: 'bg-gradient-to-br from-primary/20 to-primary/40',
    color: 'text-primary'
  }
];

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Built on a modern stack, MicroDo is deeply optimized for speed and performance.'
  },
  {
    icon: Shield,
    title: 'Bank-grade Security',
    description: 'Your data is encrypted at rest and in transit. We take your privacy seriously.'
  },
  {
    icon: Sparkles,
    title: 'Beautiful Design',
    description: 'A UI that gets out of your way and lets you focus on what matters most: your work.'
  }
];

export default function LandingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      {/* Header */}
      <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
            <CheckSquare className="text-primary-foreground" size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight">MicroDo</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button asChild className="bg-[#F4DFDE] hover:bg-[#FE812C] hover:text-white px-4 text-black rounded-xl shadow-lg shadow-[#FE812C]/20">
            <Link to="/login">
              Log In
            </Link>
          </Button>
          <Button asChild className="bg-primary/90 hover:bg-[#e5732a] text-white rounded-xl shadow-lg shadow-[#FE812C]/20">
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center justify-center text-center">
          {/* Background Effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-[#FE812C]/20 rounded-full blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted border border-border text-sm font-medium mb-4">
              <Sparkles size={16} className="text-[#FE812C]" />
              <span>MicroDo 2.0 is now live!</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
              Manage your tasks with <br className="hidden lg:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-[#FE812C] to-primary bg-300% animate-gradient">
                micro precision.
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The smart, beautiful, and intuitive task management platform designed to help fast-moving teams organize their workflow and get things done.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 gap-2 font-bold group transition-all hover:scale-105">
                <Link to="/register">
                  Start for free
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg rounded-xl border-2 hover:bg-muted font-bold transition-all">
                <Link to="/login">Sign in to workspace</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Slideshow Section */}
        <section className="py-20 px-6 bg-muted/30 border-y border-border relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">Everything you need to work faster</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Powerful features wrapped in an elegant, easy-to-use interface.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Slide Content */}
              <div className="space-y-8">
                {slides.map((slide, idx) => {
                  const isActive = idx === currentSlide;
                  const Icon = slide.icon;
                  return (
                    <div 
                      key={idx}
                      className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                        isActive 
                          ? 'bg-card border-border shadow-lg scale-100 opacity-100' 
                          : 'bg-transparent border-transparent scale-95 opacity-50 hover:opacity-80'
                      }`}
                      onClick={() => setCurrentSlide(idx)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl bg-muted ${isActive ? slide.color : 'text-muted-foreground'}`}>
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-2">{slide.title}</h3>
                          <p className="text-muted-foreground leading-relaxed">{slide.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slide Visual (Mockup) */}
              <div className="relative h-[400px] lg:h-[500px] w-full rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex items-center justify-center p-8">
                {slides.map((slide, idx) => {
                  const Icon = slide.icon;
                  return (
                    <div 
                      key={idx}
                      className={`absolute inset-0 transition-opacity duration-700 flex flex-col items-center justify-center ${
                        idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      } ${slide.imagePlaceholder}`}
                    >
                      <Icon size={120} className={`${slide.color} opacity-80 mb-8 animate-bounce`} style={{ animationDuration: '3s' }} />
                      <div className="w-3/4 h-8 bg-background/50 rounded-lg mb-4 backdrop-blur-sm" />
                      <div className="w-1/2 h-8 bg-background/50 rounded-lg backdrop-blur-sm" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="bg-card border border-border p-8 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Icon size={28} />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-24 px-6 bg-primary text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tight">Ready to boost your productivity?</h2>
            <p className="text-xl opacity-90">Join thousands of teams already using MicroDo to get things done.</p>
            <Button asChild size="lg" className="h-14 px-10 text-lg rounded-xl bg-background text-primary font-bold transition-transform hover:scale-105 shadow-2xl hover:text-white">
              <Link to="/register">Create your free workspace</Link>
            </Button>
          </div>
        </section>

        {/* Simple Footer */}
        <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border">
          <p>© {new Date().getFullYear()} MicroDo. All rights reserved.</p>
        </footer>
      </main>

      {/* Global CSS for custom animations */}
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 8s ease infinite;
        }
        .bg-300\\% {
          background-size: 300% 300%;
        }
      `}</style>
    </div>
  );
}
