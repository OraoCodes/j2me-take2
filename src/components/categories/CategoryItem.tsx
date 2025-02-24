
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
}: CategoryItemProps) => {
  return (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 group">
      <div className="flex items-center gap-3 flex-1">
        <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
        {editingId === category.id ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editingName}
              onChange={(e) => onEditingNameChange(e.target.value)}
              className="max-w-sm"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={onSaveEditing}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEditing}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span>{category.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onStartEditing(category)}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="h-4 w-4 text-gray-400" />
            </Button>
          </div>
        )}
      </div>
      <Button
        variant="ghost"
        onClick={() => onToggleVisibility(category)}
      >
        {category.is_visible ? "Hide" : "Show"}
      </Button>
    </div>
  );
};
