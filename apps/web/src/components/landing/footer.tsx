import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-[#f8f8f8] py-12 border-t border-black/5">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
           <span className="font-serif font-bold text-xl text-primary tracking-tight">Outia</span>
        </Link>
        
        <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Outia Inc. All rights reserved.
        </div>

        {/* Links */}
        <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="mailto:hello@outia.app" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
