
import { useState, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
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

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ProfileImageCropper = ({ 
  open, 
  onClose, 
  imageUrl, 
  onCropComplete 
}: ProfileImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const imageElement = e.currentTarget;
    setImageRef(imageElement);
    
    // Create a square crop
    const crop = centerAspectCrop(width, height, 1);
    setCrop(crop);
  }, []);

  const handleCropComplete = async () => {
    if (!imageRef || !crop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate the pixel values from percentages
    const scaleX = imageRef.naturalWidth / 100;
    const scaleY = imageRef.naturalHeight / 100;

    // Set the canvas size to be square based on the smaller dimension
    const size = Math.min(
      (crop.width * scaleX),
      (crop.height * scaleY)
    );
    canvas.width = size;
    canvas.height = size;

    ctx.drawImage(
      imageRef,
      (crop.x * scaleX),
      (crop.y * scaleY),
      (crop.width * scaleX),
      (crop.height * scaleY),
      0,
      0,
      size,
      size
    );

    const croppedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
    onCropComplete(croppedImageUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crop Profile Image</DialogTitle>
          <DialogDescription>
            Adjust your profile picture. The image will be cropped to a square.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            aspect={1}
            circularCrop
            keepSelection
            className="max-h-[500px] object-contain"
          >
            <img 
              src={imageUrl} 
              alt="Crop preview" 
              onLoad={onImageLoad}
              style={{ maxHeight: '500px', width: 'auto' }}
            />
          </ReactCrop>
        </div>
        <div className="flex justify-end gap-4 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCropComplete}>
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
