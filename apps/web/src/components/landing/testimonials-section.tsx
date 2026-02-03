"use client";

import { StarIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "FINALLY, AN APP THAT REMEMBERS THINGS FOR ME.", // Placeholder text from image, I will adapt to Outia
      text: "Outia notified me before my regular commute that the bridge was closed. I saved 45 minutes. It's the kind of peace of mind I didn't know I needed.",
      author: "SARA MEHAR",
    },
    {
      quote: "PERFECT FOR OUR DAILY LOGISTICS.",
      text: "I manage a small delivery fleet. Outia helps us plan routes around weather events. No more surprises or missed deadlines—it just works.",
      author: "OMAR AMJAD",
    }
  ];

  return (
    <section id="reviews" className="py-24 bg-[#E0F2F1]">
      <div className="container mx-auto px-6">
        <h2 className="text-[36px] md:text-[40px] font-bold text-primary text-center mb-16 uppercase tracking-tight">
          CUSTOMER FEEDBACK
        </h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <Card key={index} className="bg-card border-border/50 shadow-sm h-full">
              <CardContent className="p-8 flex flex-col h-full">
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <h3 className="text-xl font-extrabold text-primary mb-4 uppercase">
                  "{item.quote}"
                </h3>
                <p className="text-primary/80 mb-8 flex-1 leading-relaxed">
                  {item.text}
                </p>
                <div className="mt-auto">
                  <p className="font-bold text-primary uppercase tracking-wide">
                    {item.author}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
