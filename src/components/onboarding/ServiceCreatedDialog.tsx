
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ServiceCreatedDialogProps {
  isOpen: boolean;
  onNext: () => void;
}

export const ServiceCreatedDialog = ({ isOpen, onNext }: ServiceCreatedDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold mb-4 bg-gradient-to-r from-gebeya-pink to-gebeya-orange bg-clip-text text-transparent">
            🎉 Your Service Page is Live!
          </DialogTitle>
          <DialogDescription className="text-xl">
            Your service page has been created successfully
          </DialogDescription>
        </DialogHeader>

        <Button 
          onClick={onNext}
          className="w-full h-14 text-lg text-white bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90 transition-opacity"
        >
          Start customizing your page
        </Button>
      </DialogContent>
    </Dialog>
  );
};
