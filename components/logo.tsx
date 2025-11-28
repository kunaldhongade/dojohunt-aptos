"use client";

import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
};

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex-shrink-0", sizeClasses[size])}>
        <svg 
          viewBox="0 0 32 32" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M26.5,3c0.2,0,0.3,0,0.5,0c2.6,0.3,3.9,3.4,2.4,5.6l-9.8,14.7c-1.5,2.2-0.2,5.3,2.4,5.6c0.2,0,0.3,0,0.5,0c2.2,0,4-1.8,4-4H20" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-purple-400"
          />
          <line 
            x1="26" 
            y1="3" 
            x2="9.5" 
            y2="3" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-purple-400"
          />
          <path 
            d="M11.3,10.3l-8.7,13C1.2,25.5,2.4,28.7,5,29c0.2,0,0.3,0,0.5,0H22" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-purple-400"
          />
          <path 
            d="M9,3C6.8,3,5,4.8,5,7c0,0.5,0.2,1,0.4,1.4c0.6,1,1.8,1.6,3,1.6H24c-1,0-3.1-2.8-0.9-5.5C23.8,3.6,24.9,3,26,3c2.2,0,4,1.8,4,4" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinejoin="round"
            className="text-purple-400"
          />
          <line 
            x1="13" 
            y1="15" 
            x2="18" 
            y2="15" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-purple-400"
          />
          <line 
            x1="11" 
            y1="18" 
            x2="14" 
            y2="18" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-purple-400"
          />
        </svg>
      </div>
      {showText && (
        <span className="text-xl font-display font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient-shift">
          DojoHunt
        </span>
      )}
    </div>
  );
}

