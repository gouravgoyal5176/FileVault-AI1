import { LayoutDashboard, HardDrive, Share2, ShieldCheck, ShieldAlert, LifeBuoy, Sliders } from 'lucide-react';
import { UserNavTab } from './UserSidebar';

interface MobileBottomNavProps {
  activeTab: UserNavTab;
  setActiveTab: (tab: UserNavTab) => void;
}

export function MobileBottomNav({ activeTab, setActiveTab }: MobileBottomNavProps) {
  const primaryNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'vault', label: 'Vault', icon: HardDrive },
    { id: 'shared', label: 'Shared', icon: Share2 },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'threats', label: 'Threats', icon: ShieldAlert },
    { id: 'support', label: 'Support', icon: LifeBuoy },
    { id: 'settings', label: 'Settings', icon: Sliders },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F1E]/95 dark:bg-[#0B0F1E]/95 light:bg-white/95 backdrop-blur-xl border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {primaryNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as UserNavTab)}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              isActive
                ? 'text-indigo-400 dark:text-indigo-400 light:text-indigo-600 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-500 light:text-slate-600 hover:text-slate-300 dark:hover:text-slate-300 light:hover:text-slate-900 font-medium'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
