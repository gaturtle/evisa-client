import { useState } from "react"
import { Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getVisaPriceSetups } from "@/api/visa-price-setups"
import type { VisaPriceSetup } from "@/types/visa-price-setup"
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
import { TableContainer } from "@/components/ui/table-container"
import { VisaPriceSetupFormDialog } from "@/pages/visa-price-setups/components/VisaPriceSetupFormDialog"
import { DeleteVisaPriceSetupDialog } from "@/pages/visa-price-setups/components/DeleteVisaPriceSetupDialog"

export function VisaPriceSetupsPage() {
  const [search, setSearch] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<VisaPriceSetup | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<VisaPriceSetup | null>(null)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["visa-price-setups"],
    queryFn: getVisaPriceSetups,
  })

  const filtered = data.filter((item) => {
    const term = search.toLowerCase()
    return (
      (item.visaType?.description ?? "").toLowerCase().includes(term) ||
      (item.visaProcessing?.description ?? "").toLowerCase().includes(term)
    )
  })

  function openAdd() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(priceSetup: VisaPriceSetup) {
    setEditTarget(priceSetup)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Price Setup</h2>
        <p className="text-sm text-muted-foreground">
          Manage visa pricing by type and processing combination.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by visa type or processing…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Price Setup
        </Button>
      </div>

      <TableContainer className="shrink-0">
          <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
            <colgroup>
              <col style={{ width: 260 }} />
              <col style={{ width: 260 }} />
              <col style={{ width: 120 }} />
              <col style={{ width: 90 }} />
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-muted/80">
              <TableRow className="hover:bg-muted/80">
                <TableHead className="px-4 text-muted-foreground/70">Visa Type</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Processing</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Price</TableHead>
                <TableHead className="px-4 text-muted-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}

              {isError && (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-12 text-center text-destructive">
                    Failed to load price setups.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && !isError && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                    No price setups found.
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                filtered.map((item, index) => (
                  <TableRow
                    key={item.id}
                    className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                  >
                    <TableCell className="px-4 font-medium text-foreground/80">
                      {item.visaType?.description ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/80">
                      {item.visaProcessing?.description ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4 text-foreground/80">
                      {item.price ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => openEdit(item)}
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
                              onClick={() => setDeleteTarget(item)}
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
      </TableContainer>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {filtered.length} of {data.length} price setups
      </p>

      <VisaPriceSetupFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        priceSetup={editTarget}
      />

      <DeleteVisaPriceSetupDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        priceSetup={deleteTarget}
      />
    </div>
  )
}
