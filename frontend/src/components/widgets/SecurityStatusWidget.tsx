import { Lock, ShieldCheck, Bug, KeyRound, Cpu } from 'lucide-react';

export function SecurityStatusWidget() {
  const securityFeatures = [
    {
      title: 'AES-256-GCM Envelope',
      desc: 'Per-file Data Encryption Key (DEK) wrapped with Master Key',
      icon: Lock,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    {
      title: 'SHA-256 Checksums',
      desc: 'Cryptographic hash verification detects raw byte tampering',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      title: 'Honeyfile Deception',
      desc: 'Active decoy files trigger immediate threat lockout alerts',
      icon: Bug,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      title: 'Zero-Trust Isolation',
      desc: 'Admins cannot view or decrypt non-owned user file payloads',
      icon: KeyRound,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-600" /> Active Security Guarantees
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
          Rule #9 Enforced
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {securityFeatures.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={idx}
              className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-2 hover:border-slate-300 transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className={`p-2 rounded-lg border ${feat.color}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="text-[9px] font-extrabold uppercase text-slate-400">ACTIVE</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">{feat.title}</h4>
              <p className="text-[11px] text-slate-500 leading-snug">{feat.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
