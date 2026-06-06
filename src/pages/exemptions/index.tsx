import { useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Exemption {
  id: string;
  nationalityId: string;
  nationalityName: string;
  exemptionDays: number;
  createdAt: string;
  modifiedAt: string;
}

const mockData: Exemption[] = [
  { id: "1", nationalityId: "1", nationalityName: "Vietnamese", exemptionDays: 90, createdAt: "2024-01-10", modifiedAt: "2024-03-15" },
  { id: "2", nationalityId: "2", nationalityName: "American", exemptionDays: 45, createdAt: "2024-01-12", modifiedAt: "2024-04-20" },
  { id: "3", nationalityId: "4", nationalityName: "Japanese", exemptionDays: 30, createdAt: "2024-01-15", modifiedAt: "2024-05-01" },
  { id: "4", nationalityId: "5", nationalityName: "Korean", exemptionDays: 30, createdAt: "2024-01-15", modifiedAt: "2024-05-01" },
  { id: "5", nationalityId: "7", nationalityName: "German", exemptionDays: 45, createdAt: "2024-02-01", modifiedAt: "2024-04-10" },
  { id: "6", nationalityId: "8", nationalityName: "British", exemptionDays: 45, createdAt: "2024-02-01", modifiedAt: "2024-04-10" },
  { id: "7", nationalityId: "10", nationalityName: "Canadian", exemptionDays: 30, createdAt: "2024-02-14", modifiedAt: "2024-06-01" },
];

export function ExemptionsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter((e) =>
    e.nationalityName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      {/* Page header */}
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Exemption</h2>
        <p className="text-sm text-muted-foreground">
          Manage visa exemption days by nationality.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search exemptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              "w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            )}
          />
        </div>

        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground",
            "hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            "transition-colors shrink-0",
          )}
        >
          <Plus className="h-4 w-4" />
          Add Exemption
        </button>
      </div>

      {/* Table */}
      <div className="shrink-0 rounded-md border border-border/50 overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
          <Table className="[&_tr]:border-border/40">
            <TableHeader className="sticky top-0 z-10 bg-muted/80">
              <TableRow>
                <TableHead className="w-[35%] px-4 text-muted-foreground/70">Nationality</TableHead>
                <TableHead className="w-[20%] px-4 text-muted-foreground/70">Exemption Days</TableHead>
                <TableHead className="w-[20%] px-4 text-muted-foreground/70">Created</TableHead>
                <TableHead className="w-[25%] px-4 text-muted-foreground/70">Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-12 text-center text-muted-foreground/60"
                  >
                    No exemptions found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((exemption) => (
                  <TableRow key={exemption.id}>
                    <TableCell className="px-4 font-medium text-foreground/80">
                      {exemption.nationalityName}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/60">
                      {exemption.exemptionDays} days
                    </TableCell>
                    <TableCell className="px-4 text-foreground/60">
                      {exemption.createdAt}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/60">{exemption.modifiedAt}</span>
                        <div className="flex items-center gap-1">
                          <button
                            className={cn(
                              "inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground",
                              "hover:bg-muted hover:text-foreground transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            )}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className={cn(
                              "inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground",
                              "hover:bg-destructive/10 hover:text-destructive transition-colors",
                              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
                            )}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer count */}
      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {mockData.length} exemptions
      </p>
    </div>
  );
}
