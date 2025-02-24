
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
  const isEditing = editingId === category.id;

  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0">
      <button className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </button>
      
      <div className="flex-1">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="flex-1"
              placeholder="Category name"
            />
            <Button
              size="icon"
              variant="ghost"
              onClick={onSaveEditing}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onCancelEditing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{category.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleVisibility(category)}
          className={category.is_visible ? "text-green-600" : "text-gray-400"}
        >
          {category.is_visible ? "Visible" : "Hidden"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onStartEditing(category)}
          className="text-gray-600 hover:text-gray-700"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
