import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import type { NavItem } from "@/types/navigation";
import { NationalitiesPage } from "@/pages/nationalities";

function renderPage(item: NavItem) {
  switch (item.id) {
    case "nationality-labels":
      return <NationalitiesPage />;
    default:
      return (
        <div className="px-8 py-6 max-w-2xl">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            {item.label}
          </h1>
        </div>
      );
  }
}

function App() {
  const [activeItem, setActiveItem] = useState<NavItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex w-full h-screen bg-background text-foreground overflow-hidden">
      {/* Backdrop — mobile only, shown when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={setActiveItem}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {activeItem?.label ?? "Evisa settings"}
          </span>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {activeItem ? (
            renderPage(activeItem)
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p className="text-sm">Select a settings item from the sidebar</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
