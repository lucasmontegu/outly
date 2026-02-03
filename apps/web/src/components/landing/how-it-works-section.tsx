"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".step-card", {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "power2.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      number: "01",
      title: "Enable location & preferences",
      description: "Grant location access and tell us your commute times. We only track what's necessary to keep you safe."
    },
    {
      number: "02",
      title: "AI monitors conditions",
      description: "Our smart system constantly analyzes weather patterns and traffic flow in your area, 24/7."
    },
    {
      number: "03",
      title: "Get alerts before problems start",
      description: "Outia notifies you at the right time—before you leave—so you never get stuck in the rain or gridlock."
    }
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-[36px] md:text-[40px] font-bold text-primary mb-4 uppercase tracking-tight">
            HOW IT WORKS
          </h2>
          <p className="text-muted-foreground text-lg">
            A smarter way to start your day. Install, set, and relax.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-border border-t-2 border-dashed border-primary/20 -z-10" />

          {steps.map((step, index) => (
            <div key={index} className="step-card flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-[#E9F5EF] rounded-full flex items-center justify-center mb-8 relative z-10 border-4 border-white shadow-sm">
                <span className="text-2xl font-bold text-primary">{step.number}</span>
                <div className="absolute -bottom-2 -right-2 bg-accent text-primary text-xs font-bold px-2 py-1 rounded-full">
                    Step
                </div>
              </div>
              <h3 className="text-xl font-bold text-primary mb-4">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
