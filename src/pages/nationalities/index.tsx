import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Nationality {
  id: string;
  name: string;
  vietnameseName: string;
  isEligible: boolean;
}

const mockData: Nationality[] = [
  { id: "1", name: "Vietnamese", vietnameseName: "Việt Nam", isEligible: true },
  { id: "2", name: "American", vietnameseName: "Mỹ", isEligible: true },
  { id: "3", name: "Chinese", vietnameseName: "Trung Quốc", isEligible: false },
  { id: "4", name: "Japanese", vietnameseName: "Nhật Bản", isEligible: true },
  { id: "5", name: "Korean", vietnameseName: "Hàn Quốc", isEligible: true },
  { id: "6", name: "French", vietnameseName: "Pháp", isEligible: false },
  { id: "7", name: "German", vietnameseName: "Đức", isEligible: true },
  { id: "8", name: "British", vietnameseName: "Anh", isEligible: true },
  { id: "9", name: "Australian", vietnameseName: "Úc", isEligible: false },
  { id: "10", name: "Canadian", vietnameseName: "Canada", isEligible: true },
];

export function NationalitiesPage() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter(
    (n) =>
      n.name.toLowerCase().includes(search.toLowerCase()) ||
      n.vietnameseName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 px-8 py-6">
      {/* Page header */}
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Nationalities</h2>
        <p className="text-sm text-muted-foreground">
          Manage nationalities and their e-visa eligibility.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search nationalities..."
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
          Add Nationality
        </button>
      </div>

      {/* Table — fills remaining height and scrolls */}
      <div className="flex-1 min-h-0 rounded-lg border border-border overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-muted/80 backdrop-blur-sm">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Vietnamese Name
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Is Eligible
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-12 text-center text-muted-foreground"
                >
                  No nationalities found.
                </td>
              </tr>
            ) : (
              filtered.map((nationality, index) => (
                <tr
                  key={nationality.id}
                  className={cn(
                    "border-b border-border last:border-0 hover:bg-muted/30 transition-colors",
                    index % 2 === 0 ? "bg-background" : "bg-muted/10",
                  )}
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {nationality.name}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {nationality.vietnameseName}
                  </td>
                  <td className="px-4 py-3">
                    {nationality.isEligible ? (
                      <Badge variant="default">Eligible</Badge>
                    ) : (
                      <Badge variant="destructive">Not Eligible</Badge>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {mockData.length} nationalities
      </p>
    </div>
  );
}
