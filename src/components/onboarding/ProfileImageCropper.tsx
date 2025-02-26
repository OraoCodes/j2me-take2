
import { useState } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import 'react-image-crop/dist/ReactCrop.css';

interface ProfileImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedImageUrl: string) => void;
}

export const ProfileImageCropper = ({ 
  open, 
  onClose, 
  imageUrl, 
  onCropComplete 
}: ProfileImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0
  });

  const handleCropComplete = async () => {
    const image = new Image();
    image.src = imageUrl;
    
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    const croppedImageUrl = canvas.toDataURL('image/jpeg');
    onCropComplete(croppedImageUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Profile Image</DialogTitle>
          <DialogDescription>
            Adjust the crop area to create a square profile image
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ReactCrop
            crop={crop}
            onChange={setCrop}
            circularCrop
            keepSelection
            className="max-h-[500px] object-contain"
          >
            <img src={imageUrl} alt="Crop preview" />
          </ReactCrop>
        </div>
        <Button onClick={handleCropComplete}>Save Crop</Button>
      </DialogContent>
    </Dialog>
  );
};
