"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

import { ModeToggle } from "./mode-toggle";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const links = [
    { to: "/", label: "Home" },
    { to: "/dashboard" as any, label: "Dashboard" },
    { to: "/ai" as any, label: "AI Chat" },
  ] as const;

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
      <header className="pointer-events-auto bg-white/80 backdrop-blur-md shadow-sm border border-black/5 rounded-full px-2 py-2 flex items-center justify-between min-w-[320px] md:min-w-[600px] max-w-5xl w-full">
        
         {/* Mobile Menu Button - Left */}
         <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        
        {/* Logo Area */}
        <div className="flex items-center gap-2 pl-4 md:pl-6">
           <Link href="/" className="text-lg font-serif font-bold tracking-tight">
            Outia
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-1 items-center mx-4">
          {links.map(({ to, label }) => (
            <Link key={to} href={to} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-black/5 rounded-full transition-all">
              {label}
            </Link>
          ))}
        </nav>

        {/* Action/Toggle Area */}
        <div className="flex items-center gap-2 pr-2">
           <Link href="/dashboard" className="hidden md:flex items-center justify-center h-9 px-5 text-sm font-medium text-white bg-black rounded-full hover:bg-black/90 transition-colors">
             Get app
           </Link>
          <div className="scale-75">
            <ModeToggle />
          </div>
        </div>

      </header>
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="pointer-events-auto absolute top-full mt-4 bg-white/95 backdrop-blur-md border border-black/5 rounded-3xl p-6 shadow-xl flex flex-col items-center space-y-4 w-[calc(100%-3rem)] max-w-sm animate-in fade-in slide-in-from-top-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className="text-lg font-medium transition-colors hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
             <Link href="/dashboard" className="w-full flex items-center justify-center h-12 text-base font-medium text-white bg-black rounded-full hover:bg-black/90 transition-colors">
               Get app
             </Link>
        </div>
      )}
    </div>
  );
}
