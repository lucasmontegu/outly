"use client";

import { StoreButtons } from "./store-buttons";
import Image from "next/image";

export function FinalCTASection() {
  return (
    <section className="py-12 md:py-24 px-6">
      <div className="container mx-auto">
        <div className="bg-primary rounded-[48px] overflow-hidden flex flex-col md:flex-row shadow-2xl">
          {/* Left Content */}
          <div className="p-12 md:p-20 flex-1 flex flex-col justify-center text-left">
            <h2 className="text-[40px] md:text-[56px] font-extrabold text-white leading-[1.1] mb-8">
              Download <br />
              Mobile app
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-md">
                Get peace of mind in your pocket. Real-time alerts, everywhere you go.
            </p>
            <StoreButtons variant="light" />
          </div>

          {/* Right Image */}
          <div className="flex-1 bg-accent/20 relative min-h-[400px] md:min-h-auto flex items-end justify-center overflow-hidden">
             {/* Abstract green shapes */}
             <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-accent/40 via-primary to-primary" />
             
             {/* Phone Mockup Bottom aligned */}
             <div className="relative z-10 w-[280px] h-[400px] bg-white rounded-t-[40px] border-[8px] border-b-0 border-white shadow-2xl translate-y-10">
                <div className="w-full h-full bg-gray-50 p-4">
                    {/* Mock UI */}
                    <div className="w-full h-32 bg-primary/10 rounded-2xl mb-4 animate-pulse"></div>
                    <div className="w-full h-20 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    </div>
                    <div className="w-full h-20 bg-white rounded-2xl shadow-sm mb-4 border border-gray-100 p-4 flex gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
