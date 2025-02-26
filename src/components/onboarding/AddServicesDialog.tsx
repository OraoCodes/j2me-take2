
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AddServicesDialogProps {
  isOpen: boolean;
  onNavigateToServices: () => void;
}

export const AddServicesDialog = ({ isOpen, onNavigateToServices }: AddServicesDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            Add Your Services
          </DialogTitle>
          <DialogDescription className="text-xl">
            Start adding the services you offer
          </DialogDescription>
        </DialogHeader>

        <Button 
          onClick={onNavigateToServices}
          className="w-full h-14 text-lg text-white bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
        >
          Add Services
        </Button>
      </DialogContent>
    </Dialog>
  );
};
