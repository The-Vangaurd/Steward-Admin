"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  READY_TO_SERVE: "Ready to Serve",
};

// ─── Menu Items Tab ───────────────────────────────────────────────────────────

function MenuItemsTab({ categories }: { categories: Category[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | undefined>();
  const [deleteItem, setDeleteItem] = useState<MenuItem | undefined>();

  const { data, isLoading, isError } = useQuery({
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

  const handleAvailabilityToggle = async (item: MenuItem, isAvailable: boolean) => {
    try {
      await api.patch(`/menu/admin/items/${item.id}/availability`, { isAvailable });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
    } catch {
      toast.error("Failed to update availability");
    }
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
      <div className="flex justify-end">
        <Button
          onClick={() => { setEditItem(undefined); setSheetOpen(true); }}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add Item
        </Button>
      </div>

      <div className="rounded-lg border bg-surface shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : isError ? (
          <p className="py-12 text-center text-sm text-muted-foreground">Failed to load items.</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <UtensilsCrossed className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No menu items yet</p>
            <Button size="sm" onClick={() => { setEditItem(undefined); setSheetOpen(true); }}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add your first item
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Prep</TableHead>
                <TableHead>Kitchen</TableHead>
                <TableHead>Available</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                        <ImageIcon className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    {item.isPopular && (
                      <Badge variant="warning" className="mt-0.5 text-[10px]">Popular</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.category.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.prepTimeMins}m
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" className="text-xs">
                      {KITCHEN_TYPE_LABELS[item.kitchenType] ?? item.kitchenType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={(v) => handleAvailabilityToggle(item, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { setEditItem(item); setSheetOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteItem(item)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} items)
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!meta.hasPrevPage} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!meta.hasNextPage} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
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
              &ldquo;{deleteItem?.name}&rdquo; will be deleted or marked unavailable if it has order history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
      const { data } = await api.get<ApiSuccess<Category[]>>(
        `/menu/admin/categories`
      );
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
      <div className="flex justify-end">
        <Button onClick={() => { setEditCat(undefined); setSheetOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-lg border bg-surface shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-muted-foreground">No categories yet.</p>
            <Button size="sm" onClick={() => setSheetOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Category
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Sort Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cat.description ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{cat.sortOrder}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => { setEditCat(cat); setSheetOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteCat(cat)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader className="mb-4">
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
              &ldquo;{deleteCat?.name}&rdquo; will be permanently deleted. This fails if the category still has items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await api.get<ApiSuccess<Category[]>>(`/menu/admin/categories`);
      return data.data;
    },
    enabled: !!restaurantId,
  });

  return (
    <Tabs defaultValue="items" className="space-y-4">
      <TabsList>
        <TabsTrigger value="items">Menu Items</TabsTrigger>
        <TabsTrigger value="categories">Categories</TabsTrigger>
      </TabsList>
      <TabsContent value="items">
        <MenuItemsTab categories={categories} />
      </TabsContent>
      <TabsContent value="categories">
        <CategoriesTab />
      </TabsContent>
    </Tabs>
  );
}
