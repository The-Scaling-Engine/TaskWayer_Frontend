import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden px-8 py-14 sm:p-16 text-center
          bg-gradient-to-br from-emerald-600 to-green-700 dark:from-emerald-600 dark:to-green-800
          shadow-2xl shadow-emerald-600/20 dark:shadow-emerald-600/10"
        >
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
          }} />

          {/* Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-emerald-300/20 rounded-full blur-[80px]" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Ready to boost your productivity?
            </h2>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3.5 rounded-full text-base font-bold
                bg-white/20 backdrop-blur-sm text-white border border-white/30
                hover:bg-white/30 hover:scale-105
                transition-all duration-300
                shadow-lg"
            >
              Create your free workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
