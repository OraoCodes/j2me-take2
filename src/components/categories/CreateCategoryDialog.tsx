import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface CreateCategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName: string;
  onCategoryNameChange: (name: string) => void;
  onCreateCategory: () => void;
}
export const CreateCategoryDialog = ({
  isOpen,
  onOpenChange,
  categoryName,
  onCategoryNameChange,
  onCreateCategory
}: CreateCategoryDialogProps) => {
  return <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new category</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="categoryName">Category name</Label>
            <Input id="categoryName" value={categoryName} onChange={e => onCategoryNameChange(e.target.value)} placeholder="Enter category name" />
          </div>
          <Button onClick={onCreateCategory} className="w-full">
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};