
import { Input } from "@/components/ui/input";
import { DollarSign } from "lucide-react";

interface PaymentSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const PaymentSearch = ({ searchQuery, onSearchChange }: PaymentSearchProps) => {
  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex-1">
        <Input
          type="search"
          placeholder="Search students..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
};
