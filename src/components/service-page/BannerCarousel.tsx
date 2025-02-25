
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const bannerImages = [
  "/lovable-uploads/b46921d4-1e88-402b-a328-5caf1eeab614.png",
  "/lovable-uploads/a9da819e-6ab3-4947-accb-16b68392790e.png",
  "/lovable-uploads/7958693e-e114-4c5d-96f3-33e6561497ae.png"
];

export const BannerCarousel = () => {
  return (
    <Carousel
      opts={{
        align: "start",
        loop: true,
      }}
      className="w-full"
    >
      <CarouselContent>
        {bannerImages.map((image, index) => (
          <CarouselItem key={index} className="w-full">
            <div className="w-full h-48 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
                style={{
                  backgroundImage: `url(${image})`
                }}
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};
