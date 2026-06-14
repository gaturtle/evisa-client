import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { getCategories } from "@/api/categories"
import type { Category } from "@/types/category"
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
import { CategoryFormDialog } from "@/pages/categories/components/CategoryFormDialog"
import { DeleteCategoryDialog } from "@/pages/categories/components/DeleteCategoryDialog"

export function CategoriesPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  function openAdd() {
    setEditTarget(undefined)
    setFormOpen(true)
  }

  function openEdit(category: Category) {
    setEditTarget(category)
    setFormOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Manage post categories and their slugs.
        </p>
      </div>

      <div className="flex items-center justify-end mb-4 shrink-0">
        <Button onClick={openAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 280 }} />
            <col style={{ width: 280 }} />
            <col style={{ width: 90 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Name</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Slug</TableHead>
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
                  Failed to load categories.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="px-4 py-12 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              data.map((category, index) => (
                <TableRow
                  key={category.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                >
                  <TableCell className="px-4 font-medium text-foreground/80">
                    {category.name}
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60 font-mono text-xs">
                    {category.slug}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => openEdit(category)}
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
                            onClick={() => setDeleteTarget(category)}
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
        {data.length} {data.length === 1 ? "category" : "categories"}
      </p>

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editTarget}
      />

      <DeleteCategoryDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        category={deleteTarget}
      />
    </div>
  )
}
