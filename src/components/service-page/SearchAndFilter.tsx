
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Category {
  id: string;
  name: string;
}

interface SearchAndFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  categories: Category[];
}

export const SearchAndFilter = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories
}: SearchAndFilterProps) => {
  return (
    <>
      <div className="relative max-w-md mx-auto mt-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="text"
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full"
        />
      </div>

      <div className="mt-4">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex space-x-2 p-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-gebeya-pink to-gebeya-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      </div>
    </>
  );
};
