"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { 
  Alert02Icon, 
  Settings01Icon, 
  CheckmarkCircle01Icon 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function FeaturesSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      title: "Consolidated Feed",
      description: "Weather, traffic, and community reports in a single, intelligent timeline.",
      icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "Real-time Intelligence",
      description: "Precise, minute-by-minute risk updates for your specific route.",
      icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: "Smart Notifications",
      description: "Get alerted at the exact moment you need to leave.",
      icon: <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-6 h-6 text-emerald-600" />,
    },
  ];

  return (
    <section ref={sectionRef} id="features" className="py-32 bg-white">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-16">
           
           <div className="md:w-1/2">
               <h2 className="text-[32px] md:text-[48px] font-serif font-medium text-primary mb-8 leading-tight">
                  Everything you need, <br/>
                  <span className="text-muted-foreground/60">nothing you don't.</span>
               </h2>
               
               <div className="space-y-8">
                  {features.map((feature, index) => (
                    <div key={index} className="feature-card flex gap-4">
                        <div className="mt-1 flex-shrink-0">
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-primary mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed max-w-sm">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                  ))}
               </div>
           </div>

           {/* Decor/Visual side */}
           <div className="md:w-1/2 flex justify-center">
                <div className="relative w-full max-w-md aspect-square bg-[#f8f8f8] rounded-[40px] overflow-hidden">
                     {/* Abstract clean visual */}
                     <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                         <HugeiconsIcon icon={Settings01Icon} size={120} strokeWidth={1} />
                     </div>
                     
                     <div className="absolute bottom-8 left-8 right-8 bg-white p-6 rounded-3xl shadow-lg border border-gray-100 feature-card">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white">
                                <HugeiconsIcon icon={Alert02Icon} size={20} />
                            </div>
                            <div>
                                <div className="font-bold">Heavy Rain Alert</div>
                                <div className="text-xs text-muted-foreground">Starting in 15 mins</div>
                            </div>
                         </div>
                         <p className="text-sm text-gray-600">Consider leaving 10 minutes earlier to avoid delays on I-95.</p>
                     </div>
                </div>
           </div>

        </div>
      </div>
    </section>
  );
}
