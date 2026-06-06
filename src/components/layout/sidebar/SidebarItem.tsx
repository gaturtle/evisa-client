import { cn } from "@/lib/utils"
import type { NavItem } from "@/types/navigation"

interface SidebarItemProps {
  item: NavItem
  onClick?: (item: NavItem) => void
}

export function SidebarItem({ item, onClick }: SidebarItemProps) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={() => onClick?.(item)}
      className={cn(
        "group w-full flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors cursor-pointer",
        item.active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          item.active
            ? "text-sidebar-primary"
            : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
        )}
      />
      <span className="text-sm truncate">{item.label}</span>
    </button>
  )
}
