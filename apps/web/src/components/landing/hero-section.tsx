"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { StoreButtons } from "./store-buttons";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  SunCloud01Icon, 
  TrafficJam01Icon, 
  Location01Icon 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Text animations
      gsap.from(textRef.current?.children || [], {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power3.out",
      });

      // Visual animations
      gsap.from(visualRef.current, {
        x: 50,
        opacity: 0,
        duration: 1.2,
        delay: 0.4,
        ease: "power3.out",
      });
      
      // Floating elements animation
      gsap.to(".floating-icon", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: {
          each: 0.5,
          from: "random"
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#f8f8f8]">
      {/* Organic blob background for visual - Subtle */}
      <div className="absolute right-0 top-1/4 w-1/2 h-full bg-blue-100/30 blur-[120px] rounded-full opacity-60 pointer-events-none -z-10" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
            {/* Tagline */}
            <div ref={textRef} className="flex flex-col items-center">
                <span className="inline-block py-1 px-3 rounded-full bg-accent text-primary text-xs font-semibold tracking-wide uppercase mb-6">
                    Safety First, always
                </span>
                <h1 className="text-[48px] md:text-[64px] lg:text-[72px] font-serif font-medium leading-[1.05] tracking-tight text-primary mb-8 text-balance">
                  Smart alerts for <br/>
                  <span className="italic text-muted-foreground">safer</span> journeys.
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground/80 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Stop guessing. Get real-time weather and traffic intelligence combined into one simple risk score for your daily commute.
                </p>
                <div className="flex justify-center">
                  <StoreButtons />
                </div>
            </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
             {/* Visual Content - Centered 3D Phone Mockup */}
             <div ref={visualRef} className="relative flex justify-center items-center lg:col-span-2">
                 {/* ... (Keep existing phone mockup or enhance it) ... */}
                 <div className="relative z-10 w-[300px] md:w-[340px] h-[600px] md:h-[680px]">
                      {/* Phone Body */}
                      <div className="relative w-full h-full bg-black rounded-[56px] border-[12px] border-black shadow-2xl overflow-hidden ring-1 ring-white/20">
                         {/* Dynamic Island */}
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[28px] w-[120px] bg-black rounded-b-[18px] z-20"></div>

                         {/* Screen Content Mockup */}
                         <div className="w-full h-full bg-white relative overflow-hidden flex flex-col font-sans">
                            {/* App Header */}
                            <div className="h-16 pt-8 px-6 flex items-center justify-between z-10">
                              <div className="font-bold text-lg">Outia</div>
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                              </div>
                            </div>
                            
                            {/* Map/Content Area */}
                            <div className="flex-1 relative">
                                {/* Mock Map Background */}
                                <div className="absolute inset-0 bg-[#f0f4f8]">
                                    {/* Mock decorative map lines */}
                                    <div className="absolute top-1/4 left-0 w-full h-[2px] bg-gray-200 rotate-12"></div>
                                    <div className="absolute top-1/2 right-0 w-full h-[2px] bg-gray-200 -rotate-6"></div>
                                </div>

                                {/* Risk Card - Floating */}
                                <div className="absolute bottom-8 left-4 right-4 bg-white p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100">
                                   <div className="flex justify-between items-center mb-4">
                                      <div className="flex flex-col">
                                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Commute Risk</span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
                                            <span className="text-lg font-bold text-primary">Low Risk</span>
                                        </div>
                                      </div>
                                      <span className="text-4xl font-serif font-medium text-primary">12</span>
                                   </div>
                                   
                                   {/* Progress Bar */}
                                   <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden mb-4">
                                      <div className="h-full bg-emerald-500 w-[12%] rounded-full"></div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-3">
                                       <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
                                           <div className="bg-white p-1.5 rounded-full shadow-sm">
                                               <HugeiconsIcon icon={SunCloud01Icon} size={16} className="text-orange-400" />
                                           </div>
                                           <span className="text-sm font-medium text-gray-600">Clear</span>
                                       </div>
                                       <div className="bg-gray-50 rounded-2xl p-3 flex items-center gap-3">
                                           <div className="bg-white p-1.5 rounded-full shadow-sm">
                                               <HugeiconsIcon icon={TrafficJam01Icon} size={16} className="text-blue-400" />
                                           </div>
                                           <span className="text-sm font-medium text-gray-600">Fluent</span>
                                       </div>
                                   </div>
                                </div>
                            </div>
                         </div>
                      </div>
                      
                      {/* Decorative elements behind phone */}
                      <div className="absolute top-1/4 -right-20 w-40 h-40 bg-blue-200/50 rounded-full blur-2xl -z-10"></div>
                      <div className="absolute bottom-1/4 -left-20 w-40 h-40 bg-green-200/50 rounded-full blur-2xl -z-10"></div>
                 </div>
             </div>
        </div>
      </div>
    </section>
  );
}
