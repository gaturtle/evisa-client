import { cn } from "@/lib/utils";
import { Settings2 } from "lucide-react";

interface SidebarHeaderProps {
  className?: string;
}

export function SidebarHeader({ className }: SidebarHeaderProps) {
  return (
    <div className={cn("flex items-center justify-center px-2 py-3 border-b border-sidebar-border", className)}>
      <Settings2 className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
