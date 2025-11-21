import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<Props> = ({ searchQuery, setSearchQuery, placeholder }) => {
  return (
    <div className="relative w-full max-w-md border border-gray-200 rounded-lg">
      {/* Search Icon */}
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />

      {/* Input */}
      <Input
        type="text"
        placeholder={placeholder || "Search"}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-10 h-[44px] rounded-lg border border-gray-200 w-full"
      />
    </div>
  );
};

export default SearchBar;
