import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import { Picker } from "emoji-mart";
import data from "@emoji-mart/data";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  ArrowLeft,
  ImageIcon,
  TableIcon,
  SmileIcon,
  ChevronDown,
} from "lucide-react";

import { getPost, createPost, updatePost } from "@/api/posts";
import { getCategories } from "@/api/categories";
import type { Post } from "@/types/post";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  thumbnailUrl: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  status: z.enum(["draft", "published"]),
});

type FormValues = z.infer<typeof formSchema>;

interface PostFormProps {
  post?: Post;
  onBack: () => void;
}

export function PostForm({ post, onBack }: PostFormProps) {
  const isEdit = !!post;
  const queryClient = useQueryClient();
  const slugManuallyEdited = useRef(false);

  const { data: fullPost } = useQuery({
    queryKey: ["post", post?.slug],
    queryFn: () => getPost(post!.slug),
    enabled: isEdit,
  });
  const [tableMenuOpen, setTableMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const tableMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const form = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<
      FormValues,
      unknown,
      FormValues
    >,
    defaultValues: {
      title: post?.title ?? "",
      slug: post?.slug ?? "",
      content: post?.content ?? "",
      thumbnailUrl: post?.thumbnailUrl ?? "",
      categoryId: post?.categoryId ?? "",
      status: post?.status ?? "draft",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: post?.content ?? "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      form.setValue("content", html === "<p></p>" ? "" : html, {
        shouldValidate: form.formState.isSubmitted,
      });
    },
  });

  // Load full post content into editor and form once fetched
  useEffect(() => {
    if (!fullPost) return;
    editor?.commands.setContent(fullPost.content ?? "");
    form.reset({
      title: fullPost.title,
      slug: fullPost.slug,
      content: fullPost.content ?? "",
      thumbnailUrl: fullPost.thumbnailUrl ?? "",
      categoryId: fullPost.categoryId,
      status: fullPost.status,
    });
    slugManuallyEdited.current = false;
  }, [fullPost]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mount emoji picker web component when popover opens
  useEffect(() => {
    if (!emojiPickerOpen || !emojiContainerRef.current) return;
    const container = emojiContainerRef.current;
    container.innerHTML = "";
    const picker = new Picker({
      data,
      onEmojiSelect: (emoji: { native: string }) => {
        editor?.chain().focus().insertContent(emoji.native).run();
        setEmojiPickerOpen(false);
      },
      theme: "light",
      previewPosition: "none",
      skinTonePosition: "none",
    });
    container.appendChild(picker as unknown as Node);
  }, [emojiPickerOpen, editor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tableMenuRef.current &&
        !tableMenuRef.current.contains(e.target as Node)
      ) {
        setTableMenuOpen(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const body = {
        title: values.title,
        slug: values.slug,
        content: values.content,
        thumbnailUrl: values.thumbnailUrl || undefined,
        categoryId: values.categoryId,
        status: values.status,
      };
      return isEdit ? updatePost(post.id, body) : createPost(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(isEdit ? "Post updated." : "Post created.");
      onBack();
    },
    onError: () => {
      toast.error(isEdit ? "Failed to update post." : "Failed to create post.");
    },
  });

  function onSubmit(values: FormValues) {
    mutation.mutate(values);
  }

  function handleLinkToggle() {
    if (!editor) return;
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("Enter URL");
      if (url) {
        editor.chain().focus().setLink({ href: url }).run();
      }
    }
  }

  function handleImageInsert() {
    if (!editor) return;
    const url = window.prompt("Enter image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
  ];

  const isInsideTable = editor?.isActive("table") ?? false;

  return (
    <div className="flex flex-col flex-1 min-h-0 px-8 py-6">
      <div className="mb-5 shrink-0 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {isEdit ? "Edit Post" : "Create Post"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? "Update the post details below."
              : "Fill in the details to create a new post."}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 max-w-3xl"
        >
          <div className="grid grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Post title"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!slugManuallyEdited.current) {
                          form.setValue("slug", toSlug(e.target.value), {
                            shouldValidate: false,
                          });
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="post-slug"
                      {...field}
                      onChange={(e) => {
                        slugManuallyEdited.current = true;
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="content"
            render={() => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <div className="rounded-md border border-input bg-background">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
                      <ToolbarButton
                        active={
                          editor?.isActive("heading", { level: 1 }) ?? false
                        }
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 1 })
                            .run()
                        }
                        title="Heading 1"
                      >
                        <Heading1 className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <ToolbarButton
                        active={
                          editor?.isActive("heading", { level: 2 }) ?? false
                        }
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 2 })
                            .run()
                        }
                        title="Heading 2"
                      >
                        <Heading2 className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <ToolbarButton
                        active={
                          editor?.isActive("heading", { level: 3 }) ?? false
                        }
                        onClick={() =>
                          editor
                            ?.chain()
                            .focus()
                            .toggleHeading({ level: 3 })
                            .run()
                        }
                        title="Heading 3"
                      >
                        <Heading3 className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <div className="mx-1 h-4 w-px bg-border" />
                      <ToolbarButton
                        active={editor?.isActive("bold") ?? false}
                        onClick={() =>
                          editor?.chain().focus().toggleBold().run()
                        }
                        title="Bold"
                      >
                        <Bold className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <ToolbarButton
                        active={editor?.isActive("italic") ?? false}
                        onClick={() =>
                          editor?.chain().focus().toggleItalic().run()
                        }
                        title="Italic"
                      >
                        <Italic className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <div className="mx-1 h-4 w-px bg-border" />
                      <ToolbarButton
                        active={editor?.isActive("bulletList") ?? false}
                        onClick={() =>
                          editor?.chain().focus().toggleBulletList().run()
                        }
                        title="Bullet List"
                      >
                        <List className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <ToolbarButton
                        active={editor?.isActive("orderedList") ?? false}
                        onClick={() =>
                          editor?.chain().focus().toggleOrderedList().run()
                        }
                        title="Ordered List"
                      >
                        <ListOrdered className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <div className="mx-1 h-4 w-px bg-border" />
                      <ToolbarButton
                        active={editor?.isActive("link") ?? false}
                        onClick={handleLinkToggle}
                        title="Link"
                      >
                        <LinkIcon className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <ToolbarButton
                        active={false}
                        onClick={handleImageInsert}
                        title="Image"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                      </ToolbarButton>
                      <div className="mx-1 h-4 w-px bg-border" />

                      {/* Table dropdown */}
                      <div className="relative" ref={tableMenuRef}>
                        <button
                          type="button"
                          title="Table"
                          onClick={() => setTableMenuOpen((o) => !o)}
                          className={`flex h-6 items-center gap-0.5 rounded px-1 transition-colors hover:bg-muted ${
                            isInsideTable
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          <TableIcon className="h-3.5 w-3.5" />
                          <ChevronDown className="h-2.5 w-2.5" />
                        </button>
                        {tableMenuOpen && (
                          <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-popover py-1 shadow-md">
                            <TableMenuItem
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .insertTable({
                                    rows: 3,
                                    cols: 3,
                                    withHeaderRow: true,
                                  })
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Insert table
                            </TableMenuItem>
                            <div className="my-1 h-px bg-border" />
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .addRowBefore()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Add row above
                            </TableMenuItem>
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .addRowAfter()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Add row below
                            </TableMenuItem>
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .deleteRow()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Delete row
                            </TableMenuItem>
                            <div className="my-1 h-px bg-border" />
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .addColumnBefore()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Add column left
                            </TableMenuItem>
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .addColumnAfter()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Add column right
                            </TableMenuItem>
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .deleteColumn()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Delete column
                            </TableMenuItem>
                            <div className="my-1 h-px bg-border" />
                            <TableMenuItem
                              disabled={!isInsideTable}
                              onClick={() => {
                                editor
                                  ?.chain()
                                  .focus()
                                  .deleteTable()
                                  .run();
                                setTableMenuOpen(false);
                              }}
                            >
                              Delete table
                            </TableMenuItem>
                          </div>
                        )}
                      </div>

                      {/* Emoji picker */}
                      <div className="relative" ref={emojiPickerRef}>
                        <ToolbarButton
                          active={emojiPickerOpen}
                          onClick={() => setEmojiPickerOpen((o) => !o)}
                          title="Emoji"
                        >
                          <SmileIcon className="h-3.5 w-3.5" />
                        </ToolbarButton>
                        {emojiPickerOpen && (
                          <div className="absolute left-0 top-full z-50 mt-1">
                            <div ref={emojiContainerRef} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Editor area */}
                    <EditorContent
                      editor={editor}
                      className="prose prose-sm max-w-none px-3 py-2 min-h-48 focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-44 [&_.ProseMirror_p]:my-1 [&_.ProseMirror_h1]:text-xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_a]:text-primary [&_.ProseMirror_a]:underline [&_.ProseMirror_table]:border-collapse [&_.ProseMirror_table]:w-full [&_.ProseMirror_td]:border [&_.ProseMirror_td]:border-border [&_.ProseMirror_td]:p-1.5 [&_.ProseMirror_th]:border [&_.ProseMirror_th]:border-border [&_.ProseMirror_th]:p-1.5 [&_.ProseMirror_th]:bg-muted [&_.ProseMirror_th]:font-semibold [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Thumbnail URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Combobox
                      options={categoryOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select a category…"
                      searchPlaceholder="Search categories…"
                      emptyText="No categories found."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Combobox
                      options={statusOptions}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select status…"
                      searchPlaceholder="Search…"
                      emptyText=""
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Post"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

interface ToolbarButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-muted ${
        active ? "bg-muted text-foreground" : "text-muted-foreground"
      }`}
    >
      {children}
    </button>
  );
}

interface TableMenuItemProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

function TableMenuItem({ onClick, disabled, children }: TableMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
