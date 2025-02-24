import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Pencil, Check, X } from "lucide-react";
interface Category {
  id: string;
  name: string;
  is_visible: boolean;
  sequence: number;
  user_id: string;
  created_at: string;
}
interface CategoryItemProps {
  category: Category;
  editingId: string | null;
  editingName: string;
  onStartEditing: (category: Category) => void;
  onSaveEditing: () => void;
  onCancelEditing: () => void;
  onEditingNameChange: (name: string) => void;
  onToggleVisibility: (category: Category) => void;
  onEditCategory: (category: Category) => void;
}
export const CategoryItem = ({
  category,
  editingId,
  editingName,
  onStartEditing,
  onSaveEditing,
  onCancelEditing,
  onEditingNameChange,
  onToggleVisibility,
  onEditCategory
}: CategoryItemProps) => {
  return;
};