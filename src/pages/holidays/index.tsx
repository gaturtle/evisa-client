import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getHolidays } from "@/api/holidays"
import type { Holiday } from "@/types/holiday"
import { Button } from "@/components/ui/button"
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
import { HolidayFormDialog } from "@/pages/holidays/components/HolidayFormDialog"
import { DeleteHolidayDialog } from "@/pages/holidays/components/DeleteHolidayDialog"

const CURRENT_YEAR = new Date().getFullYear()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric" }).format(date)
}

export function HolidaysPage() {
  const [year, setYear] = useState(CURRENT_YEAR)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["holidays", year],
    queryFn: () => getHolidays(year),
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Holidays</h2>
        <p className="text-sm text-muted-foreground">
          Manage public holidays used to calculate processing time estimates.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-semibold tabular-nums">{year}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Button onClick={() => setFormOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Holiday
        </Button>
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 160 }} />
            <col style={{ width: 280 }} />
            <col style={{ width: 80 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Date</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Name</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-12 text-center text-destructive">
                  Failed to load holidays.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  No holidays configured for {year}.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              data.map((holiday, index) => (
                <TableRow
                  key={holiday.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                >
                  <TableCell className="px-4 text-foreground/60 tabular-nums">
                    {formatDate(holiday.date)}
                  </TableCell>
                  <TableCell className="px-4 font-medium text-foreground/80">
                    {holiday.name}
                  </TableCell>
                  <TableCell className="px-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(holiday)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {data.length} holiday{data.length !== 1 ? "s" : ""} in {year}
      </p>

      <HolidayFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        year={year}
      />

      <DeleteHolidayDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        holiday={deleteTarget}
        year={year}
      />
    </div>
  )
}
