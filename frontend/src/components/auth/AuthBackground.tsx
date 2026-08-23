import { motion } from 'framer-motion';

export function AuthBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0 bg-[#05070E]">
      {/* Subtle Tech Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: `linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Primary Ambient Glows */}
      <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Floating Ambient Micro Particles */}
      {[
        { top: '15%', left: '10%', size: 'w-1 h-1', color: 'bg-cyan-400/40', delay: 0, duration: 7 },
        { top: '25%', left: '85%', size: 'w-1.5 h-1.5', color: 'bg-indigo-400/50', delay: 1, duration: 9 },
        { top: '65%', left: '15%', size: 'w-2 h-2', color: 'bg-blue-400/30', delay: 2, duration: 8 },
        { top: '75%', left: '80%', size: 'w-1 h-1', color: 'bg-emerald-400/40', delay: 0.5, duration: 10 },
        { top: '45%', left: '90%', size: 'w-1.5 h-1.5', color: 'bg-cyan-300/40', delay: 3, duration: 11 },
        { top: '85%', left: '45%', size: 'w-1 h-1', color: 'bg-indigo-300/40', delay: 1.5, duration: 7.5 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full ${p.size} ${p.color}`}
          style={{ top: p.top, left: p.left }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Faint Horizontal Scanning Line */}
      <motion.div
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent"
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}
