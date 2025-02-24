
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EditCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: {
    id: string;
    name: string;
    is_visible: boolean;
  } | null;
  onSave: (categoryData: {
    name: string;
    is_visible: boolean;
    description?: string;
  }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditCategoryDialog({
  isOpen,
  onClose,
  category,
  onSave,
  onDelete,
}: EditCategoryDialogProps) {
  const [name, setName] = useState(category?.name || "");
  const [visibility, setVisibility] = useState<string>(
    category?.is_visible ? "visible" : "hidden"
  );
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!category) return;
    setIsLoading(true);
    try {
      await onSave({
        name,
        is_visible: visibility === "visible",
        description,
      });
      onClose();
    } catch (error) {
      console.error("Failed to save category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    setIsLoading(true);
    try {
      await onDelete(category.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete category:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="hover:opacity-70">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              Category
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit your category details</p>
                </TooltipContent>
              </Tooltip>
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="font-medium flex items-center gap-1">
              Name
              <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter category name"
            />
          </div>

          <div className="space-y-2">
            <label className="font-medium flex items-center gap-1">
              Visibility
              <span className="text-red-500">*</span>
            </label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visible">Visible</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description must be less than 100 characters"
              maxLength={100}
            />
            <p className="text-sm text-gray-500">
              {description.length}/100 characters
            </p>
          </div>

          <div className="pt-4 flex gap-4">
            <Button
              onClick={handleSave}
              disabled={isLoading || !name}
              className="flex-1 bg-gray-900 text-white hover:bg-gray-800"
            >
              Save
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
