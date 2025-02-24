import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Image, Plus, Trash, ChevronUp, ChevronDown, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  name: string;
  price: number;
  image?: File;
  imagePreview?: string;
}

interface ServiceTemplate {
  category: string;
  services: {
    name: string;
    price: number;
    description: string;
  }[];
}

const serviceTemplates: ServiceTemplate[] = [
  {
    category: "Freelance Graphic Designer",
    services: [
      {
        name: "Logo Design",
        price: 7500,
        description: "Professional logo design with multiple revisions",
      },
      {
        name: "Social Media Post Design",
        price: 1500,
        description: "Eye-catching social media post designs",
      }
    ]
  },
  {
    category: "Personal Trainer",
    services: [
      {
        name: "1-on-1 Virtual Workout Session",
        price: 3000,
        description: "Personalized virtual training session",
      },
      {
        name: "4-Week Custom Workout Plan",
        price: 12000,
        description: "Comprehensive month-long workout program",
      }
    ]
  },
  {
    category: "Makeup Artist",
    services: [
      {
        name: "Bridal Makeup",
        price: 15000,
        description: "Complete bridal makeup service",
      },
      {
        name: "Casual Event Makeup",
        price: 7500,
        description: "Professional makeup for any occasion",
      }
    ]
  },
  {
    category: "Photographer",
    services: [
      {
        name: "Professional Headshots",
        price: 11250,
        description: "High-quality professional headshot session",
      },
      {
        name: "Event Photography (3 Hours)",
        price: 30000,
        description: "Event coverage with edited photos",
      }
    ]
  }
];

const AddProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([{ name: "", price: 0 }]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleImageUpload = (index: number, file: File) => {
    const newProducts = [...products];
    newProducts[index] = {
      ...newProducts[index],
      image: file,
      imagePreview: URL.createObjectURL(file),
    };
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: "", price: 0 }]);
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
  };

  const useTemplate = (template: ServiceTemplate) => {
    setSelectedCategory(template.category);
    const newProducts = template.services.map(service => ({
      name: service.name,
      price: service.price
    }));
    setProducts(newProducts);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header />
      <div className="container mx-auto px-4 py-24 max-w-3xl">
        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 
                  ${step === 1 
                    ? "border-gebeya-pink bg-white text-gebeya-pink" 
                    : "border-gray-200 text-gray-400"
                  }`}
              >
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Add Your Services</h1>
          <p className="text-gray-600 text-lg">
            List your services, set pricing, and upload images to showcase your work
          </p>
        </div>

        {/* Example Templates */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Choose from example templates:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {serviceTemplates.map((template) => (
              <button
                key={template.category}
                onClick={() => useTemplate(template)}
                className={`p-4 text-left rounded-lg border transition-all ${
                  selectedCategory === template.category
                    ? "border-gebeya-pink bg-pink-50"
                    : "border-gray-200 hover:border-gebeya-pink"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{template.category}</h3>
                  <Copy className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {template.services.map(service => (
                    <div key={service.name} className="mt-1">
                      • {service.name} - KES {service.price.toLocaleString()}
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Service Forms */}
        <div className="space-y-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`product-name-${index}`} className="flex items-center gap-2">
                    <span>🔹</span> Service Name
                  </Label>
                  <Input
                    id={`product-name-${index}`}
                    value={product.name}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].name = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="mt-1"
                    placeholder="Enter service name"
                  />
                </div>

                <div>
                  <Label htmlFor={`product-price-${index}`} className="flex items-center gap-2">
                    <span>💰</span> Price
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id={`product-price-${index}`}
                      type="number"
                      value={product.price}
                      onChange={(e) => {
                        const newProducts = [...products];
                        newProducts[index].price = Number(e.target.value);
                        setProducts(newProducts);
                      }}
                      className="pl-8"
                      placeholder="Enter price"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                      <ChevronUp className="w-4 h-4 text-gray-400 cursor-pointer" />
                      <ChevronDown className="w-4 h-4 text-gray-400 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <input
                      type="file"
                      id={`product-image-${index}`}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(index, file);
                      }}
                    />
                    <label
                      htmlFor={`product-image-${index}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-50"
                    >
                      <span>🖼️</span>
                      Add image
                    </label>
                  </div>
                  <button
                    onClick={() => removeProduct(index)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                </div>

                {product.imagePreview && (
                  <div className="mt-4">
                    <img
                      src={product.imagePreview}
                      alt="Service preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Service Button */}
        <button
          onClick={addProduct}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gebeya-pink hover:text-gebeya-pink flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Another Service
        </button>

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
            onClick={() => navigate('/payment-methods')}
          >
            Skip
          </Button>
          <Button 
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
            onClick={() => navigate('/payment-methods')}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddProducts;
