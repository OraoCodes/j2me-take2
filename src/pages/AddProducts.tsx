
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Image, Plus, Trash, ChevronUp, ChevronDown } from "lucide-react";

interface Product {
  name: string;
  price: number;
  image?: File;
  imagePreview?: string;
}

const AddProducts = () => {
  const [products, setProducts] = useState<Product[]>([{ name: "", price: 0 }]);

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
          <h1 className="text-4xl font-bold mb-4">Add products</h1>
          <p className="text-gray-600 text-lg">
            Add product names, prices, and images to your store
          </p>
        </div>

        {/* Product Forms */}
        <div className="space-y-8">
          {products.map((product, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="space-y-4">
                <div>
                  <Label htmlFor={`product-name-${index}`}>Product name</Label>
                  <Input
                    id={`product-name-${index}`}
                    value={product.name}
                    onChange={(e) => {
                      const newProducts = [...products];
                      newProducts[index].name = e.target.value;
                      setProducts(newProducts);
                    }}
                    className="mt-1"
                    placeholder="Product name"
                  />
                </div>

                <div>
                  <Label htmlFor={`product-price-${index}`}>Price</Label>
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
                      <Image className="w-5 h-5" />
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
                      alt="Product preview"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Product Button */}
        <button
          onClick={addProduct}
          className="w-full mt-6 py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-gebeya-pink hover:text-gebeya-pink flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add product
        </button>

        {/* Navigation Buttons */}
        <div className="mt-12 flex justify-center gap-4">
          <Button
            variant="outline"
            className="w-32"
          >
            Skip
          </Button>
          <Button 
            className="w-32 bg-gradient-to-r from-gebeya-pink to-gebeya-orange hover:opacity-90"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddProducts;
