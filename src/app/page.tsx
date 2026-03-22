import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-black text-white p-6 object-cover selection:bg-fuchsia-500/30 selection:text-fuchsia-50">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      
      <main className="z-10 text-center max-w-4xl mx-auto space-y-8 backdrop-blur-sm bg-white/5 p-12 rounded-3xl border border-white/10 shadow-2xl">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 to-indigo-300">
          Fullstack Engineering
        </h1>
        
        <p className="text-lg md:text-xl text-indigo-200/80 font-light leading-relaxed max-w-2xl mx-auto">
          Equipped with Next.js, Shadcn UI, Tailwind CSS, TypeScript, and ESLint.
          Ready to build dynamic and highly performant applications at scale.
        </p>
        
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button size="lg" className="bg-white text-indigo-950 hover:bg-slate-200 rounded-full font-semibold shadow-lg shadow-white/20 transition-all active:scale-95 duration-200">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="rounded-full font-semibold border-white/20 text-white hover:bg-white/10 backdrop-blur-md transition-all active:scale-95 duration-200">
            Documentation
          </Button>
        </div>
      </main>

      <footer className="absolute bottom-8 text-sm text-indigo-300/50 font-medium">
        Powered by Next.js & Shadcn UI
      </footer>
    </div>
  )
}
