import { navigationSections } from "@/config/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/types/navigation";
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
        "flex flex-col border-r border-sidebar-border",
        "w-48 h-full overflow-visible",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        open ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:translate-x-0 lg:shrink-0",
        className,
      )}
    >
      <SidebarHeader />

      <nav
        className="flex-1 overflow-y-auto overflow-x-visible px-1.5 py-1.5 flex flex-col gap-3"
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
    </aside>
  );
}
