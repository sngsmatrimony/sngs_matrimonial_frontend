import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-[#F5E6C3]/60 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

export { Skeleton }
