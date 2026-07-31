import React from 'react';
import { Award, Sparkles, Calendar, Percent } from 'lucide-react';

interface AnniversaryBannerProps {
  logoUrl: string;
}

export default function AnniversaryBanner({ logoUrl }: AnniversaryBannerProps) {
  return (
    <div id="anniversary-banner-container" className="relative flex flex-col justify-between p-8 md:p-12 h-full bg-[#0B0F19] text-slate-100 rounded-3xl md:rounded-r-3xl border border-slate-800/80 overflow-hidden">
      {/* Background Subtle Accent Gradients */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Logo */}
      <div id="banner-header" className="flex items-center justify-between w-full z-10">
        <div className="flex items-center gap-3">
          <img
            src={logoUrl}
            alt="PHETMANY Logo"
            className="w-12 h-12 object-contain rounded-full shadow-md border border-slate-800 p-0.5 bg-white"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-white font-display font-bold text-lg leading-tight tracking-wide">
              PHETMANY
            </span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-0.5">
              Diamonds & Jewelry
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/80 backdrop-blur-xs rounded-full border border-slate-800/80 shadow-xs">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-[10px] font-bold text-slate-300 tracking-wider uppercase">EST. 2026</span>
        </div>
      </div>

      {/* Main Content Area: Grid of Discount and 34 Years Commemorative Seal */}
      <div id="banner-main-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center z-10">
        
        {/* Left Grid: Offer / Discount Display */}
        <div id="banner-discount-col" className="lg:col-span-6 flex flex-col items-center text-center space-y-4">
          <div className="space-y-1">
            <p className="font-cursive text-5xl text-blue-400/90 leading-none mb-1">
              Exclusive
            </p>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-white tracking-widest leading-none uppercase">
              CELEBRATION OFFER
            </h2>
          </div>

          {/* 1.34% OFF - Large Royal Blue Circle */}
          <div className="relative group cursor-pointer animate-float">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-md group-hover:opacity-60 transition-opacity duration-300" />
            
            {/* Main Circle Component */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col items-center justify-center text-white border border-slate-800 shadow-2xl overflow-hidden">
              {/* Shine effect */}
              <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent skew-y-12 transform origin-top-left" />
              
              <span className="font-display font-extrabold text-4xl sm:text-5xl tracking-tighter text-blue-400 drop-shadow-md">
                1.34%
              </span>
              <span className="font-display font-black text-xl sm:text-2xl tracking-widest uppercase mt-1 text-white/90 drop-shadow-sm">
                OFF
              </span>
            </div>
          </div>

          {/* Date Badge Banner */}
          <div className="w-full max-w-xs bg-slate-900/90 text-slate-200 px-4 py-3 rounded-2xl shadow-lg border border-slate-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold tracking-wide text-slate-100">
                2nd July 2026 onwards*
              </span>
            </div>
            <p className="text-[9px] text-slate-400 font-semibold mt-1 uppercase tracking-wider">
              09:00 AM (IST) onwards
            </p>
          </div>

          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider italic">
            on all your diamond purchases!
          </p>
        </div>

        {/* Right Grid: Grand Launch Certified Brilliance Badge */}
        <div id="banner-launch-col" className="lg:col-span-6 flex flex-col items-center text-center space-y-4">
          <div className="relative w-48 h-48 sm:w-52 sm:h-52 bg-[#0E1524] p-4 rounded-2xl border border-slate-800 shadow-xl flex items-center justify-center overflow-hidden group">
            {/* Outer Ring Accent */}
            <div className="absolute inset-2 rounded-lg border border-dashed border-slate-800/80" />

            {/* Commemorative Coin Visual */}
            <div className="relative w-full h-full rounded-full bg-slate-950 border-2 border-slate-800 shadow-inner flex flex-col items-center justify-center p-3">
              <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">PHETMANY DIAMONDS</span>
              
              {/* Premium Sparkles Icon */}
              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full border border-slate-800 animate-spin-slow opacity-25" />
                <div className="z-10 bg-slate-900 p-3.5 rounded-full border border-slate-800 shadow-md">
                  <Sparkles className="w-8 h-8 text-amber-400 animate-pulse-subtle" />
                </div>
              </div>

              <div className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-widest shadow-xs">
                GRAND LAUNCH
              </div>
              
              <span className="text-[8px] font-bold text-slate-500 mt-1.5 uppercase tracking-wider">
                CERTIFIED LUXURY
              </span>
            </div>
          </div>

          <div className="max-w-[240px] space-y-1.5">
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Discover the finest collection of handcrafted, GIA-certified diamonds and exquisite jewelry.
            </p>
            <p className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
              Experience absolute elegance & perfection.
            </p>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div id="banner-footer" className="text-center z-10 pt-4 border-t border-slate-900/60">
        <p className="text-[9px] text-slate-500 uppercase tracking-widest">
          *Terms & conditions apply. For verified registered users only.
        </p>
      </div>
    </div>
  );
}
