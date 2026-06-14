import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getPosts, updatePostStatus } from "@/api/posts"
import { getCategories } from "@/api/categories"
import type { Post } from "@/types/post"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TableContainer } from "@/components/ui/table-container"
import { Combobox } from "@/components/ui/combobox"
import { DeletePostDialog } from "@/pages/posts/components/DeletePostDialog"

export type PostView = "list" | "create" | "edit"

interface PostsPageProps {
  onNavigate?: (view: PostView, post?: Post) => void
}

export function PostsPage({ onNavigate }: PostsPageProps = {}) {
  const [view, setView] = useState<PostView>("list")
  const [editPost, setEditPost] = useState<Post | null>(null)
  const [categoryFilter, setCategoryFilter] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null)

  const queryClient = useQueryClient()

  const { data: posts = [], isLoading, isError } = useQuery({
    queryKey: ["posts", { categoryId: categoryFilter }],
    queryFn: () => getPosts(categoryFilter ? { categoryId: categoryFilter } : undefined),
  })

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const toggleStatusMutation = useMutation({
    mutationFn: (post: Post) =>
      updatePostStatus(post.id, {
        status: post.status === "published" ? "draft" : "published",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: () => {
      toast.error("Failed to update post status.")
    },
  })

  const categoryOptions = [
    { value: "", label: "All Categories" },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ]

  function handleCreatePost() {
    setView("create")
    onNavigate?.("create")
  }

  function handleEditPost(post: Post) {
    setEditPost(post)
    setView("edit")
    onNavigate?.("edit", post)
  }

  // Phase 3 will intercept view changes and render the form.
  // For now, suppress unused-variable warnings by referencing them:
  void view
  void editPost

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Posts</h2>
        <p className="text-sm text-muted-foreground">
          Manage blog posts and their content.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 shrink-0">
        <Combobox
          options={categoryOptions}
          value={categoryFilter}
          onValueChange={setCategoryFilter}
          placeholder="All Categories"
          searchPlaceholder="Search categories…"
          emptyText="No categories found."
          className="w-56"
        />
        <Button onClick={handleCreatePost} className="shrink-0">
          <Plus className="h-4 w-4" />
          Create Post
        </Button>
      </div>

      <TableContainer className="shrink-0">
        <Table className="min-w-max table-fixed text-sm [&_tr]:border-border/40">
          <colgroup>
            <col style={{ width: 280 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 130 }} />
          </colgroup>
          <TableHeader className="sticky top-0 z-10 bg-muted/80">
            <TableRow className="hover:bg-muted/80">
              <TableHead className="px-4 text-muted-foreground/70">Title</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Category</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Status</TableHead>
              <TableHead className="px-4 text-muted-foreground/70">Created At</TableHead>
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
                  Failed to load posts.
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isError && posts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No posts yet.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !isError &&
              posts.map((post, index) => (
                <TableRow
                  key={post.id}
                  className={index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                >
                  <TableCell className="px-4 font-medium text-foreground/80 truncate max-w-0">
                    {post.title}
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60">
                    {post.category?.name ?? "—"}
                  </TableCell>
                  <TableCell className="px-4">
                    {post.status === "published" ? (
                      <Badge variant="default">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-foreground/60 text-xs">
                    {new Date(post.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground"
                            onClick={() => handleEditPost(post)}
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
                            onClick={() => setDeleteTarget(post)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            disabled={toggleStatusMutation.isPending}
                            onClick={() => toggleStatusMutation.mutate(post)}
                          >
                            {post.status === "published" ? "Unpublish" : "Publish"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {post.status === "published" ? "Set to Draft" : "Publish post"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <p className="mt-2 text-xs text-muted-foreground shrink-0">
        {posts.length} {posts.length === 1 ? "post" : "posts"}
      </p>

      <DeletePostDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        post={deleteTarget}
      />
    </div>
  )
}
