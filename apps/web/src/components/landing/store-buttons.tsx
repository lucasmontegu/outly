import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface StoreButtonsProps {
  className?: string;
  variant?: "light" | "dark";
}

export function StoreButtons({ className, variant = "dark" }: StoreButtonsProps) {
  const isDark = variant === "dark";
  
  return (
    <div className={cn("flex flex-col sm:flex-row gap-4", className)}>
      <Button
        size="lg"
        className={cn(
          "h-14 px-6 rounded-full font-semibold transition-transform hover:-translate-y-1",
          isDark 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "bg-white text-primary hover:bg-white/90"
        )}
      >
        <Link href="#">
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.6 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C3.15 17 1.84 12.45 3.6 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M11.9 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          <div className="text-left flex flex-col items-start leading-none">
            <span className="text-[10px] uppercase opacity-80">Download on the</span>
            <span className="text-sm font-bold">App Store</span>
          </div>
        </Link>
      </Button>
      
      <Button
        size="lg"
        variant="outline"
        className={cn(
          "h-14 px-6 rounded-full font-semibold border-2 transition-transform hover:-translate-y-1",
          isDark
            ? "border-primary/10 bg-transparent text-primary hover:bg-primary/5"
            : "border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
        )}
      >
        <Link href="#">
          <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35m13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27m3.35-4.31c.34.27.56.69.56 1.19s-.22.92-.56 1.19l-2.29 1.32-2.5-2.5 2.5-2.5 2.29 1.3M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" />
          </svg>
          <div className="text-left flex flex-col items-start leading-none">
            <span className="text-[10px] uppercase opacity-80">Get it on</span>
            <span className="text-sm font-bold">Google Play</span>
          </div>
        </Link>
      </Button>
    </div>
  );
}
