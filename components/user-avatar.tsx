"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarProps } from "@/lib/avatar-utils";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string;
  alt?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-10 w-10 text-base",
  xl: "h-12 w-12 text-lg",
};

export function UserAvatar({
  name,
  src,
  alt,
  className,
  size = "md",
}: UserAvatarProps) {
  const { initial, colorClass } = getAvatarProps(name);
  const sizeClass = sizeClasses[size];

  return (
    <Avatar className={cn(sizeClass, className)}>
      <AvatarImage 
        src={src} 
        alt={alt || name}
        className="object-cover"
        onError={(e) => {
          // Hide image on error, show fallback
          e.currentTarget.style.display = 'none';
        }}
      />
      <AvatarFallback className={cn(colorClass, "text-white font-semibold")}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
