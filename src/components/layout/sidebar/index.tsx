import { navigationSections } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarSection } from "./SidebarSection";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  onNavigate?: (item: NavItem) => void;
  className?: string;
}

export function Sidebar({ open = false, onClose, onNavigate, className }: SidebarProps) {
  function handleNavigate(item: NavItem) {
    onNavigate?.(item);
    onClose?.();
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-sidebar-border bg-sidebar",
        "w-48 h-full overflow-visible",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:shrink-0",
        className,
      )}
    >
      <SidebarHeader />

      <ScrollArea className="flex-1">
        <nav
          className="px-1.5 py-1.5 flex flex-col gap-3"
          aria-label="Settings navigation"
        >
          {navigationSections.map((section, index) => (
            <div key={section.id}>
              {index > 0 && (
                <div className="mx-1.5 mb-3 border-t border-sidebar-border" />
              )}
              <SidebarSection
                section={section}
                onItemClick={handleNavigate}
              />
            </div>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
