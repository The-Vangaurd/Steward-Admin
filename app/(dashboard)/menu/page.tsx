"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, UtensilsCrossed, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { MenuItemForm } from "@/components/menu/MenuItemForm";
import { CategoryForm } from "@/components/menu/CategoryForm";
import { formatCurrency } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/auth.store";
import type { MenuItem, Category, ApiSuccess, PaginationMeta } from "@/types";

const KITCHEN_TYPE_LABELS: Record<string, string> = {
  MAIN: "Main",
  TIME_TAKING: "Time Taking",
  READY_TO_SERVE: "Ready",
};

// ─── Menu Items Tab ───────────────────────────────────────────────────────────

function MenuItemsTab({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const [deleteItem, setDeleteItem] = useState<MenuItem | undefined>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["menu-items", page],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
        "/menu/admin/items",
        { params: { page, limit: 20 } }
      );
      return data;
    },
  });

  const items = data?.data ?? [];
  const meta = data?.meta;

  const toggleMutation = useMutation({
    mutationFn: async ({ item, isAvailable }: { item: MenuItem; isAvailable: boolean }) => {
      const { data } = await api.patch<ApiSuccess<MenuItem>>(
        `/menu/admin/items/${item.id}/availability`,
        { isAvailable }
      );
      return data.data;
    },
    onMutate: async ({ item, isAvailable }) => {
      await queryClient.cancelQueries({ queryKey: ["menu-items", page] });
      const previousData = queryClient.getQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(["menu-items", page]);

      if (previousData) {
        queryClient.setQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
          ["menu-items", page],
          {
            ...previousData,
            data: previousData.data.map((i) =>
              i.id === item.id ? { ...i, isAvailable } : i
            ),
          }
        );
      }

      return { previousData };
    },
    onSuccess: (updatedItem) => {
      toast.success(
        `${updatedItem.name} marked ${updatedItem.isAvailable ? "available" : "unavailable"}`
      );
      queryClient.setQueryData<ApiSuccess<MenuItem[]> & { meta: PaginationMeta }>(
        ["menu-items", page],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((current) => (current.id === updatedItem.id ? updatedItem : current)),
          };
        }
      );
    },
    onError: (error: unknown, { item, isAvailable }, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["menu-items", page], context.previousData);
      }
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err?.response?.data?.message ?? "Failed to update availability");
    },
  });

  const handleAvailabilityToggle = (item: MenuItem, isAvailable: boolean) => {
    toggleMutation.mutate({ item, isAvailable });
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await api.delete(`/menu/admin/items/${deleteItem.id}`);
      toast.success("Item deleted");
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to delete item");
    } finally {
      setDeleteItem(undefined);
    }
  };

  return (
    <div className="space-y-3">
      {/* Sub-header */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-fg-subtle">
          {meta ? `${meta.total.toLocaleString()} items · Page ${meta.page} of ${meta.totalPages}` : ""}
        </p>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditItem(undefined); setSheetOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" /> Add Item
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-[13px] text-fg-muted">Failed to load menu items.</p>
            <Button size="sm" variant="secondary" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <UtensilsCrossed className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No menu items yet</p>
            <p className="text-[11px] text-fg-subtle">Add your first item to get started</p>
            <Button size="sm" className="gap-1.5 mt-1"
              onClick={() => { setEditItem(undefined); setSheetOpen(true); }}>
              <Plus className="h-3.5 w-3.5" /> Add Item
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-surface-2 hover:bg-surface-2">
                  <TableHead className="h-9 w-14 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Image</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Name</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Category</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Price</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Prep</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Kitchen</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Available</TableHead>
                  <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="border-border hover:bg-surface-2 transition-colors">
                    <TableCell className="py-2.5">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 border border-border">
                          <ImageIcon className="h-4 w-4 text-fg-subtle" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <p className="text-[13px] font-medium text-fg">{item.name}</p>
                      {item.isPopular && (
                        <Badge variant="warning" className="mt-0.5 text-[10px]">Popular</Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted">
                      {item.category.name}
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] font-semibold text-fg num">
                      {formatCurrency(item.price)}
                    </TableCell>
                    <TableCell className="py-2.5 text-[12px] text-fg-muted num">
                      {item.prepTimeMins}m
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Badge variant="neutral" className="text-[10px]">
                        {KITCHEN_TYPE_LABELS[item.kitchenType] ?? item.kitchenType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2.5">
                      <Switch
                        checked={item.isAvailable}
                        onCheckedChange={(v) => handleAvailabilityToggle(item, v)}
                      />
                    </TableCell>
                    <TableCell className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditItem(item); setSheetOpen(true); }}
                          className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteItem(item)}
                          className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <span className="text-[11px] text-fg-subtle num">
              Showing {(meta.page - 1) * 20 + 1}–{Math.min(meta.page * 20, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="secondary" disabled={!meta.hasPrevPage}
                onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="secondary" disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editItem ? "Edit Menu Item" : "Add Menu Item"}</SheetTitle>
          </SheetHeader>
          <MenuItemForm
            item={editItem}
            categories={categories}
            onSuccess={() => {
              setSheetOpen(false);
              queryClient.invalidateQueries({ queryKey: ["menu-items"] });
            }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteItem} onOpenChange={(o) => !o && setDeleteItem(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete menu item?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteItem?.name}&rdquo; will be permanently deleted or marked unavailable
              if it has order history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────

function CategoriesTab() {
  const queryClient = useQueryClient();
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | undefined>();
  const [deleteCat, setDeleteCat] = useState<Category | undefined>();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/menu/admin/categories`);
      return data.data;
    },
    enabled: !!restaurantId,
  });

  const handleDelete = async () => {
    if (!deleteCat) return;
    try {
      await api.delete(`/menu/admin/categories/${deleteCat.id}`);
      toast.success("Category deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string; error?: { code?: string } } } };
      if (e?.response?.data?.error?.code === "CONFLICT") {
        toast.error("Remove all items from this category first.");
      } else {
        toast.error(e?.response?.data?.message ?? "Failed to delete category");
      }
    } finally {
      setDeleteCat(undefined);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[12px] text-fg-subtle">
          {categories.length > 0 ? `${categories.length} categor${categories.length !== 1 ? "ies" : "y"}` : ""}
        </p>
        <Button size="sm" className="gap-1.5"
          onClick={() => { setEditCat(undefined); setSheetOpen(true); }}>
          <Plus className="h-3.5 w-3.5" /> Add Category
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        {isLoading ? (
          <div className="space-y-1.5 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md bg-surface-2" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 border border-border">
              <UtensilsCrossed className="h-5 w-5 text-fg-subtle" />
            </div>
            <p className="text-[13px] font-medium text-fg">No categories yet</p>
            <Button size="sm" className="gap-1.5 mt-1" onClick={() => setSheetOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Category
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-surface-2 hover:bg-surface-2">
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Name</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Description</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle">Sort Order</TableHead>
                <TableHead className="h-9 text-[10px] font-semibold uppercase tracking-wider text-fg-subtle text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} className="border-border hover:bg-surface-2 transition-colors">
                  <TableCell className="py-2.5 text-[13px] font-medium text-fg">{cat.name}</TableCell>
                  <TableCell className="py-2.5 text-[12px] text-fg-muted">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell className="py-2.5 text-[12px] text-fg-muted num">{cat.sortOrder}</TableCell>
                  <TableCell className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setEditCat(cat); setSheetOpen(true); }}
                        className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-surface-3 hover:text-fg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteCat(cat)}
                        className="inline-grid h-7 w-7 place-items-center rounded-md border border-border text-fg-muted hover:bg-danger/10 hover:text-danger hover:border-danger/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-5">
            <SheetTitle>{editCat ? "Edit Category" : "Add Category"}</SheetTitle>
          </SheetHeader>
          <CategoryForm
            category={editCat}
            onSuccess={() => {
              setSheetOpen(false);
              queryClient.invalidateQueries({ queryKey: ["categories"] });
            }}
            onCancel={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteCat} onOpenChange={(o) => !o && setDeleteCat(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{deleteCat?.name}&rdquo; will be permanently deleted. This fails if the
              category still has items — remove them first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-white hover:bg-danger/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const restaurantId = useAuthStore((s) => s.user?.restaurantId);

  // Single category query — shared with MenuItemsTab via prop
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/menu/admin/categories`);
      return data.data;
    },
    enabled: !!restaurantId,
  });

  return (
    <div className="px-5 py-5 lg:px-6 lg:py-6 space-y-5 max-w-[1400px] mx-auto">
      {/* Page header */}
      <div className="pb-1">
        <div className="label-xs mb-1">Catalogue</div>
        <h2 className="text-xl font-semibold tracking-tight text-fg">Menu</h2>
        <p className="text-[12px] text-fg-subtle mt-1">
          Manage your restaurant&apos;s items and categories.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="items">
        <TabsList className="flex-wrap h-auto gap-1 bg-surface border border-border p-1 rounded-lg mb-5">
          {[
            { value: "items", label: "Menu Items" },
            { value: "categories", label: "Categories" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-[12px] font-medium data-[state=active]:bg-surface-3 data-[state=active]:text-fg rounded-md px-3 py-1.5"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="items">
          <MenuItemsTab categories={categories} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
