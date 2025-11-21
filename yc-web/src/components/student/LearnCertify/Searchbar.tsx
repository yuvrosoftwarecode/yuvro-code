// src/features/LearnCertify/components/SearchBar.tsx
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
    <div className="group relative left-0 w-full max-w-md">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
      <Input
        type="text"
        placeholder={placeholder || "Search"}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-14 h-[44px] rounded-full border border-blue-200"
      />
    </div>
  );
};

export default SearchBar;