import { cn } from "@/lib/utils"
import { SidebarItem } from "./SidebarItem"
import type { NavItem, NavSection } from "@/types/navigation"

interface SidebarSectionProps {
  section: NavSection
  onItemClick?: (item: NavItem) => void
  className?: string
}

export function SidebarSection({ section, onItemClick, className }: SidebarSectionProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <p className="px-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
        {section.title}
      </p>
      {section.items.map((item) => (
        <SidebarItem key={item.id} item={item} onClick={onItemClick} />
      ))}
    </div>
  )
}
