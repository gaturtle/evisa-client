import { useState } from "react"
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getApplications } from "@/api/applications"
import {
  ApplicationStatus,
  APPLICATION_STATUS_LABELS,
  type VisaApplicationListItem,
} from "@/types/application"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { TableContainer } from "@/components/ui/table-container"
// PROTOTYPE — swap back to "./components/ApplicationDetailDrawer" (ApplicationDetailDrawer)
// once a variant is picked. See ApplicationDetailDrawerPrototype.tsx.
import { ApplicationDetailDrawerPrototype as ApplicationDetailDrawer } from "./components/ApplicationDetailDrawerPrototype"

const ALL_STATUSES = [
  ApplicationStatus.Submitted,
  ApplicationStatus.UnderReview,
  ApplicationStatus.Approved,
  ApplicationStatus.Rejected,
  ApplicationStatus.RequiresAction,
  ApplicationStatus.Cancelled,
]

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  [ApplicationStatus.Submitted]:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  [ApplicationStatus.UnderReview]:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  [ApplicationStatus.Approved]:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  [ApplicationStatus.Rejected]:
    "border-transparent bg-destructive text-white",
  [ApplicationStatus.RequiresAction]:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400",
  [ApplicationStatus.Cancelled]:
    "border-transparent bg-secondary text-secondary-foreground",
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge className={STATUS_BADGE_CLASSES[status]}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  )
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso))
}

const selectClass =
  "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"

export function ApplicationsPage() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | undefined>(undefined)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function resetPage() {
    setPage(1)
  }

  const hasActiveFilters = statusFilter !== undefined || fromDate !== "" || toDate !== ""

  function clearFilters() {
    setStatusFilter(undefined)
    setFromDate("")
    setToDate("")
    setPage(1)
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications", { page, pageSize, statusFilter, fromDate, toDate }],
    queryFn: () =>
      getApplications({
        page,
        pageSize,
        status: statusFilter,
        from: fromDate || undefined,
        to: toDate || undefined,
      }),
  })

  const items: VisaApplicationListItem[] = data?.items ?? []
  const totalCount = data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const colSpan = 7

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Applications</h2>
        <p className="text-sm text-muted-foreground">
          Review and manage all visa applications.
        </p>
      </div>

      {/* Filter toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 shrink-0">
        <select
          value={statusFilter ?? ""}
          onChange={(e) => {
            setStatusFilter(e.target.value === "" ? undefined : Number(e.target.value) as ApplicationStatus)
            resetPage()
          }}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {APPLICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">From</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value)
              resetPage()
            }}
            className={selectClass}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">To</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value)
              resetPage()
            }}
            className={selectClass}
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 140 }} />
            <col style={{ width: 200 }} />
            <col style={{ width: 220 }} />
            <col style={{ width: 100 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 70 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Reference No.</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Contact Name</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Email</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Applicants</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Status</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Created</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}

            {isError && (
              <TableRow>
                <TableCell colSpan={colSpan} className="px-4 py-12 text-center text-destructive">
                  Failed to load applications.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && items.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
                  No applications found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              items.map((app, index) => (
                <TableRow
                  key={app.id}
                  className={`cursor-pointer ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}`}
                  onClick={() => setSelectedId(app.id)}
                >
                  <TableCell className="px-4 font-mono text-xs font-medium text-foreground/80">
                    {app.referenceNumber}
                  </TableCell>
                  <TableCell className="px-4 font-medium text-foreground/80">
                    {app.contactFullName}
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60">
                    {app.contactEmail}
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60">
                    {app.applicantCount}
                  </TableCell>
                  <TableCell className="px-4">
                    <StatusBadge status={app.status} />
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60">
                    {formatDate(app.createdDateTime)}
                  </TableCell>
                  <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setSelectedId(app.id)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View</TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Footer: count + pagination */}
      <div className="mt-3 flex items-center justify-between shrink-0">
        <p className="text-xs text-muted-foreground">
          {totalCount === 0
            ? "No applications"
            : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount} applications`}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Rows</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ApplicationDetailDrawer
        applicationId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  )
}
