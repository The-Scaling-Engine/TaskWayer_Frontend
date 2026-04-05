import { Link } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, Users, CheckSquare, ListTodo, Clock } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-28 pb-8 sm:pt-32 sm:pb-12 lg:pt-40 lg:pb-16 px-4 sm:px-6 overflow-hidden">
      {/* ===== Background Blobs (prominent, organic, 3D-like) ===== */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Main large blob - top right */}
        <div
          className="absolute -top-32 -right-24 w-[600px] h-[500px] opacity-80 dark:opacity-60"
          style={{
            background: 'radial-gradient(ellipse at 40% 40%, #10BA41 0%, #034D36 40%, transparent 70%)',
            borderRadius: '60% 40% 50% 50% / 40% 60% 40% 60%',
            filter: 'blur(40px)',
          }}
        />
        {/* Second blob - left */}
        <div
          className="absolute top-[40%] -left-40 w-[500px] h-[400px] opacity-60 dark:opacity-40"
          style={{
            background: 'radial-gradient(ellipse at 60% 50%, #10BA41 0%, #034D36 50%, transparent 75%)',
            borderRadius: '40% 60% 70% 30% / 50% 40% 60% 50%',
            filter: 'blur(50px)',
          }}
        />
        {/* Third blob - bottom right */}
        <div
          className="absolute -bottom-20 right-[20%] w-[400px] h-[350px] opacity-50 dark:opacity-30"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #10BA41 0%, #034D36 45%, transparent 70%)',
            borderRadius: '50% 50% 40% 60% / 60% 40% 50% 50%',
            filter: 'blur(45px)',
          }}
        />
        {/* Small accent blobs */}
        <div
          className="absolute top-[15%] right-[35%] w-[150px] h-[120px] opacity-70 dark:opacity-40"
          style={{
            background: 'radial-gradient(circle, #10BA41 0%, transparent 70%)',
            borderRadius: '60% 40% 50% 50% / 50% 60% 40% 60%',
            filter: 'blur(30px)',
          }}
        />
        <div
          className="absolute bottom-[30%] left-[15%] w-[120px] h-[100px] opacity-60 dark:opacity-30"
          style={{
            background: 'radial-gradient(circle, #10BA41 0%, transparent 70%)',
            borderRadius: '40% 60% 50% 50% / 60% 40% 50% 60%',
            filter: 'blur(25px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
          {/* Left: Text Content */}
          <div className="space-y-7">
            <h1 className="text-[2.8rem] sm:text-5xl lg:text-[4rem] xl:text-[4.5rem] font-extrabold leading-[1.08] tracking-tight text-foreground">
              Manage your tasks
              <br />
              with{' '}
              <span className="relative inline-block">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 dark:from-emerald-300 dark:to-green-400 italic">
                  micro
                </span>
                {/* Neon glow under the word */}
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-green-500 dark:from-emerald-300 dark:to-green-400 blur-sm opacity-60" />
              </span>{' '}
              precision.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-lg leading-relaxed">
              The smart, beautiful, and intuitive task management platform designed to
              help fast-moving teams organize their workflow and get things done.
            </p>

            <div className="flex flex-wrap gap-4 pt-1">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-bold
                  bg-gradient-to-r from-emerald-500 to-green-600 dark:from-emerald-400 dark:to-green-500
                  text-white
                  shadow-xl shadow-emerald-500/30 dark:shadow-emerald-400/25
                  hover:shadow-emerald-500/50 dark:hover:shadow-emerald-400/40
                  hover:scale-105 transition-all duration-300"
              >
                Start for free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-sm sm:text-base font-bold
                  border border-border dark:border-white/20
                  text-foreground
                  hover:bg-white/10 dark:hover:bg-white/5
                  transition-all duration-300"
              >
                Sign in to workspace
              </Link>
            </div>
          </div>

          {/* Right: Organic Glass Blob with UI Mockups */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Outer glow */}
            <div
              className="absolute w-[420px] h-[380px] lg:w-[480px] lg:h-[420px] opacity-40 dark:opacity-25"
              style={{
                background: 'radial-gradient(ellipse, #10BA41 0%, transparent 60%)',
                borderRadius: '60% 40% 55% 45% / 45% 55% 45% 55%',
                filter: 'blur(40px)',
              }}
            />

            {/* Main organic glass blob */}
            <div
              className="relative w-[320px] h-[290px] sm:w-[380px] sm:h-[340px] lg:w-[430px] lg:h-[380px]
                bg-white/15 dark:bg-white/5
                backdrop-blur-xl
                border border-white/25 dark:border-white/10
                shadow-2xl shadow-black/10 dark:shadow-black/30
                flex items-center justify-center overflow-hidden"
              style={{
                borderRadius: '60% 40% 55% 45% / 45% 60% 40% 55%',
              }}
            >
              {/* Inner subtle gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-emerald-500/5 dark:from-white/5 dark:to-emerald-500/5" style={{ borderRadius: 'inherit' }} />

              {/* Floating UI cards inside blob */}
              <div className="relative w-[250px] h-[230px] sm:w-[290px] sm:h-[260px] lg:w-[330px] lg:h-[290px]">
                {/* Card 1: Kanban Board */}
                <div className="absolute top-0 left-2 w-[110px] sm:w-[130px]
                  bg-white/60 dark:bg-white/10
                  backdrop-blur-md
                  border border-white/40 dark:border-white/15
                  rounded-xl p-2.5 shadow-lg
                  transform -rotate-3 hover:rotate-0 transition-transform duration-500"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <LayoutDashboard size={10} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-bold text-foreground/70 dark:text-white/70">Dashboard</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-emerald-500/25 rounded-full" />
                    <div className="h-1.5 w-4/5 bg-emerald-500/20 rounded-full" />
                    <div className="h-1.5 w-3/5 bg-emerald-500/15 rounded-full" />
                    <div className="h-1.5 w-2/3 bg-emerald-500/10 rounded-full" />
                  </div>
                </div>

                {/* Card 2: Team */}
                <div className="absolute top-2 right-0 w-[100px] sm:w-[120px]
                  bg-white/60 dark:bg-white/10
                  backdrop-blur-md
                  border border-white/40 dark:border-white/15
                  rounded-xl p-2.5 shadow-lg
                  transform rotate-6 hover:rotate-0 transition-transform duration-500"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <Users size={10} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-bold text-foreground/70 dark:text-white/70">Team</span>
                  </div>
                  <div className="flex gap-1 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/30 border border-emerald-500/20" />
                    <div className="w-4 h-4 rounded-full bg-teal-500/30 border border-teal-500/20" />
                    <div className="w-4 h-4 rounded-full bg-green-500/30 border border-green-500/20" />
                  </div>
                  <div className="h-1.5 w-full bg-emerald-500/15 rounded-full" />
                </div>

                {/* Card 3: Tasks List */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[140px] sm:w-[160px]
                  bg-white/60 dark:bg-white/10
                  backdrop-blur-md
                  border border-white/40 dark:border-white/15
                  rounded-xl p-2.5 shadow-lg
                  hover:scale-105 transition-transform duration-500"
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <ListTodo size={10} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[9px] font-bold text-foreground/70 dark:text-white/70">Task Board</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <CheckSquare size={8} className="text-emerald-500 shrink-0" />
                      <div className="h-1.5 flex-1 bg-emerald-500/25 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={8} className="text-amber-500 shrink-0" />
                      <div className="h-1.5 flex-1 bg-amber-500/20 rounded-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckSquare size={8} className="text-emerald-500 shrink-0" />
                      <div className="h-1.5 flex-1 bg-emerald-500/20 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Small decorative floating blobs around the main blob */}
            <div
              className="absolute -top-6 right-12 w-14 h-14 bg-emerald-500/40 dark:bg-emerald-500/25 blur-[2px]"
              style={{ borderRadius: '50% 40% 60% 40% / 40% 50% 40% 60%', animation: 'float 6s ease-in-out infinite' }}
            />
            <div
              className="absolute -bottom-4 left-10 w-10 h-10 bg-green-500/35 dark:bg-green-500/20 blur-[2px]"
              style={{ borderRadius: '40% 60% 50% 50% / 60% 40% 50% 50%', animation: 'float 4s ease-in-out infinite 1s' }}
            />
            <div
              className="absolute top-1/2 -right-6 w-12 h-10 bg-teal-500/30 dark:bg-teal-500/15 blur-[2px]"
              style={{ borderRadius: '55% 45% 50% 50% / 45% 55% 45% 55%', animation: 'float 5s ease-in-out infinite 2s' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
