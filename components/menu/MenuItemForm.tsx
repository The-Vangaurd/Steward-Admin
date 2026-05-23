"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from "@/lib/axios";
import type { MenuItem, Category, ApiSuccess } from "@/types";

const schema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1).max(150),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().positive("Price must be positive"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  kitchenType: z.enum(["MAIN", "TIME_TAKING", "READY_TO_SERVE"]),
  isAvailable: z.boolean(),
  isPopular: z.boolean(),
  calories: z.coerce.number().int().positive().optional().or(z.literal("")),
  prepTimeMins: z.coerce.number().int().min(1).max(180),
  sortOrder: z.coerce.number().int(),
});

type FormValues = z.infer<typeof schema>;

interface MenuItemFormProps {
  item?: MenuItem;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function MenuItemForm({ item, categories, onSuccess, onCancel }: MenuItemFormProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(item?.imageUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: item?.category.id ?? "",
      name: item?.name ?? "",
      description: item?.description ?? "",
      price: item ? parseFloat(item.price) : 0,
      imageUrl: item?.imageUrl ?? "",
      kitchenType: item?.kitchenType ?? "MAIN",
      isAvailable: item?.isAvailable ?? true,
      isPopular: item?.isPopular ?? false,
      calories: item?.calories ?? undefined,
      prepTimeMins: item?.prepTimeMins ?? 15,
      sortOrder: item?.sortOrder ?? 0,
    },
  });

  const imageUrl = watch("imageUrl");
  const isAvailable = watch("isAvailable");
  const isPopular = watch("isPopular");
  const kitchenType = watch("kitchenType");

  useEffect(() => {
    setPreviewUrl(imageUrl ?? "");
  }, [imageUrl]);

  const handleFileUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post<ApiSuccess<{ url: string }>>(
        "/menu/admin/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setValue("imageUrl", data.data.url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        ...values,
        calories: values.calories === "" ? undefined : values.calories,
        imageUrl: values.imageUrl === "" ? undefined : values.imageUrl,
      };
      if (item) {
        await api.put(`/menu/admin/items/${item.id}`, payload);
        toast.success("Menu item updated");
      } else {
        await api.post("/menu/admin/items", payload);
        toast.success("Menu item created");
      }
      onSuccess();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message ?? "Failed to save item");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto">
      {/* Image */}
      <div className="space-y-2">
        <Label>Image</Label>
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-gray-50 overflow-hidden flex-shrink-0">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="preview" className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-300" />
            )}
          </div>
          <div className="space-y-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-1.5 h-3.5 w-3.5" />}
              Upload Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
            <p className="text-xs text-muted-foreground">Max 5MB</p>
          </div>
        </div>
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label>Category *</Label>
        <Select
          value={watch("categoryId")}
          onValueChange={(v) => setValue("categoryId", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input {...register("name")} placeholder="e.g. Butter Chicken" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register("description")} rows={2} placeholder="Short description…" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Price */}
        <div className="space-y-1.5">
          <Label>Price (₹) *</Label>
          <Input type="number" step="0.01" {...register("price")} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        {/* Prep Time */}
        <div className="space-y-1.5">
          <Label>Prep Time (min) *</Label>
          <Input type="number" {...register("prepTimeMins")} />
          {errors.prepTimeMins && <p className="text-xs text-destructive">{errors.prepTimeMins.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Kitchen Type */}
        <div className="space-y-1.5">
          <Label>Kitchen Type *</Label>
          <Select
            value={kitchenType}
            onValueChange={(v) => setValue("kitchenType", v as "MAIN" | "TIME_TAKING" | "READY_TO_SERVE")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN">Main</SelectItem>
              <SelectItem value="TIME_TAKING">Time Taking</SelectItem>
              <SelectItem value="READY_TO_SERVE">Ready to Serve</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Calories */}
        <div className="space-y-1.5">
          <Label>Calories (optional)</Label>
          <Input type="number" {...register("calories")} placeholder="e.g. 450" />
        </div>
      </div>

      {/* Sort Order */}
      <div className="space-y-1.5">
        <Label>Sort Order</Label>
        <Input type="number" {...register("sortOrder")} />
      </div>

      {/* Toggles */}
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={isAvailable}
            onCheckedChange={(v) => setValue("isAvailable", v)}
            id="isAvailable"
          />
          <Label htmlFor="isAvailable">Available</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={isPopular}
            onCheckedChange={(v) => setValue("isPopular", v)}
            id="isPopular"
          />
          <Label htmlFor="isPopular">Popular</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting || uploading}>
          {isSubmitting ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          {item ? "Update Item" : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
