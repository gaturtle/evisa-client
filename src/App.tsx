import { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import type { NavItem } from "@/types/navigation";
import { navigationSections } from "@/config/navigation";
import { LoginPage } from "@/pages/login";
import { useAuth } from "@/context/AuthContext";

const defaultItem = navigationSections
  .flatMap((s) => s.items)
  .find((item) => item.id === "Application-list")!;

function App() {
  const { token } = useAuth();
  const [activeItem, setActiveItem] = useState<NavItem>(defaultItem);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!token) return <LoginPage />;

  const PageComponent = activeItem.component;

  return (
    <div className="flex w-full h-screen bg-background text-foreground overflow-hidden">
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
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {activeItem.label}
          </span>
        </header>

        <main className="flex-1 overflow-hidden flex flex-col">
          {PageComponent ? (
            <PageComponent />
          ) : (
            <div className="px-8 py-6 max-w-2xl">
              <h1 className="text-2xl font-semibold text-foreground mb-1">
                {activeItem.label}
              </h1>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
