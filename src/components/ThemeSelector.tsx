import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sun, Moon, Leaf, Flame, Anchor } from 'lucide-react';

interface ThemeSelectorProps {
  theme: 'light' | 'orange' | 'green' | 'dark' | 'navy';
  setTheme: (theme: 'light' | 'orange' | 'green' | 'dark' | 'navy') => void;
  variant: 'header' | 'sidebar' | 'mobile-nav';
}

export default function ThemeSelector({ theme, setTheme, variant }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themes = [
    {
      id: 'dark',
      name: 'Dark Current Mode',
      desc: 'Deep royal blue & indigo',
      icon: Moon,
      colors: ['bg-[#070c22]', 'bg-[#17214e]', 'bg-[#576cb4]'],
    },
    {
      id: 'light',
      name: 'Light Mode',
      desc: 'Elegant slate & pristine white',
      icon: Sun,
      colors: ['bg-[#ffffff]', 'bg-[#f1f5f9]', 'bg-[#475569]'],
    },
    {
      id: 'orange',
      name: 'Orange Mode',
      desc: 'Elegant cream & copper amber',
      icon: Flame,
      colors: ['bg-[#ffffff]', 'bg-[#faf7f4]', 'bg-[#8c6a4d]'],
    },
    {
      id: 'green',
      name: 'Green Mode',
      desc: 'Pristine mint & forest sage',
      icon: Leaf,
      colors: ['bg-[#ffffff]', 'bg-[#f1faf6]', 'bg-[#529981]'],
    },
    {
      id: 'navy',
      name: 'Navy Blue Mode',
      desc: 'Vibrant navy & glowing sapphire',
      icon: Anchor,
      colors: ['bg-[#0b132b]', 'bg-[#1c2541]', 'bg-[#6b82c4]'],
    },
  ] as const;

  const currentThemeName = themes.find(t => t.id === theme)?.name || 'Dark Mode';

  if (variant === 'header') {
    return (
      <div ref={menuRef} className="relative inline-block select-none">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
            isOpen ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
          }`}
          title="Change Visual Theme"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Theme</span>
        </button>

        {isOpen && (
          <div className="absolute top-full mt-2.5 right-0 w-72 bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] z-50 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-200">Appearance Theme</h4>
              <p className="text-[8.5px] text-slate-500 mt-0.5">Select a luxury color tone for your boutique screen.</p>
            </div>

            <div className="space-y-1.5">
              {themes.map((t) => {
                const Icon = t.icon;
                const isSelected = theme === t.id;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-amber-500/60 shadow-inner'
                        : 'bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg transition-all ${
                        isSelected ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-900 text-slate-500 group-hover:text-slate-300'
                      }`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isSelected ? 'text-amber-400' : 'text-slate-300'
                        }`}>
                          {t.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        {t.colors.map((c, idx) => (
                          <div key={idx} className={`w-2.5 h-2.5 rounded-full border border-slate-950/40 ${c}`} />
                        ))}
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'mobile-nav') {
    return (
      <div ref={menuRef} className="w-full select-none text-left">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-left transition-all cursor-pointer flex items-center justify-between bg-slate-900/50 hover:bg-slate-900 text-slate-300"
        >
          <span className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-slate-400" />
            <span>Theme: {currentThemeName}</span>
          </span>
          <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
            Select
          </span>
        </button>

        {isOpen && (
          <div className="mt-1.5 w-full bg-slate-950 border border-slate-800 rounded-2xl p-2.5 space-y-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60'
                      : 'bg-slate-950 border-transparent hover:bg-slate-900/20'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className={`text-[10.5px] font-bold uppercase tracking-wider ${isSelected ? 'text-amber-400' : 'text-slate-300'}`}>
                      {t.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1">
                      {t.colors.map((c, idx) => (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full border border-slate-950/40 ${c}`} />
                      ))}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Admin Sidebar style
  return (
    <div ref={menuRef} className="relative select-none text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
          isOpen ? 'bg-slate-900 text-white border-l-2 border-amber-500 pl-[14px]' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
        }`}
      >
        <Palette className="w-4 h-4" />
        <span>Theme Settings</span>
        <span className="ml-auto text-[8px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">
          {theme}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 md:left-full bottom-full md:bottom-auto md:top-0 ml-0 md:ml-3 mb-2 md:mb-0 w-72 bg-slate-950 border border-slate-850 rounded-3xl p-4 shadow-[5px_20px_50px_rgba(0,0,0,0.8)] z-50 space-y-3 animate-in fade-in slide-in-from-left-3 duration-200">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-200">Admin Environment Theme</h4>
            <p className="text-[8.5px] text-slate-500 mt-0.5">Choose high-performance styling presets.</p>
          </div>

          <div className="space-y-1.5">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;

              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left group cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500/60'
                      : 'bg-slate-950 border-slate-900 hover:border-slate-800 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                      isSelected ? 'text-amber-400 font-extrabold' : 'text-slate-300'
                    }`}>
                      {t.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {t.colors.map((c, idx) => (
                        <div key={idx} className={`w-2.5 h-2.5 rounded-full border border-slate-950/40 ${c}`} />
                      ))}
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-amber-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
