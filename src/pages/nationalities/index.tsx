import { useState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getNationalities } from "@/api/nationalities"
import type { VisaNationality } from "@/types/nationality"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NationalityFormDialog } from "@/pages/nationalities/components/NationalityFormDialog"
import { DeleteNationalityDialog } from "@/pages/nationalities/components/DeleteNationalityDialog"

export function NationalitiesPage() {
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VisaNationality | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<VisaNationality | null>(null)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["nationalities"],
    queryFn: getNationalities,
  })

  const filtered = data.filter(
    (n) =>
      n.origName.toLowerCase().includes(search.toLowerCase()) ||
      n.vietnameseName.toLowerCase().includes(search.toLowerCase())
  )

  function openAdd() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(nationality: VisaNationality) {
    setEditTarget(nationality)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Nationalities</h2>
        <p className="text-sm text-muted-foreground">
          Manage nationalities and their e-visa eligibility.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search nationalities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Nationality
        </Button>
      </div>

      <div className="shrink-0 rounded-lg border border-border/50 overflow-hidden">
        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
          <Table className="w-full table-fixed text-sm [&_tr]:border-border/40">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[28%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[12%]" />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-muted/80">
              <TableRow className="hover:bg-muted/80">
                <TableHead className="px-4 text-muted-foreground/70">Name</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Vietnamese Name</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Is Eligible</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Exemption Days</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-destructive">
                    Failed to load nationalities.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No nationalities found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((nationality, index) => (
                  <TableRow
                    key={nationality.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                  >
                    <TableCell className="px-4 font-medium text-foreground/80">
                      {nationality.origName}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/60">
                      {nationality.vietnameseName}
                    </TableCell>
                    <TableCell className="px-4">
                      {nationality.isEligible ? (
                        <Badge variant="default">Eligible</Badge>
                      ) : (
                        <Badge variant="destructive">Not Eligible</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/60">
                      {nationality.visaExemption
                        ? `${nationality.visaExemption.exemptionDays} days`
                        : "—"}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => openEdit(nationality)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteTarget(nationality)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {data.length} nationalities
      </p>

      <NationalityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        nationality={editTarget}
      />

      <DeleteNationalityDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        nationality={deleteTarget}
      />
    </div>
  )
}
