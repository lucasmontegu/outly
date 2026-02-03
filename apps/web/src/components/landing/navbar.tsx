"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled ? "bg-white/90 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
           <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
             <span className="text-white font-bold text-xl">O</span>
           </div>
           <span className="font-bold text-xl text-primary tracking-tight">Outia</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
           <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
             Features
           </Link>
           <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
             How it Works
           </Link>
           <Link href="#reviews" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
             Reviews
           </Link>
        </div>

        <Button variant="default" size="lg" className="rounded-full px-6">
          <Link href="#download">Download</Link>
        </Button>
      </div>
    </nav>
  );
}
