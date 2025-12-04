import { useState } from "react";
import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iconMap } from "@/lib/iconMap";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

const iconList: Array<{ name: string; icon: LucideIcon }> = Object.entries(
  iconMap
).map(([name, icon]) => ({ name, icon }));

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState("");

  const filteredIcons = iconList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedIcon = iconList.find((item) => item.name === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Label htmlFor="icon-search">Search Icon</Label>
          <Input
            id="icon-search"
            type="text"
            placeholder="Search icons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-1"
          />
        </div>
        {selectedIcon && (
          <div className="flex flex-col items-center gap-1">
            <Label className="text-xs">Selected</Label>
            <div className="p-2 border-2 border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-950">
              <selectedIcon.icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        )}
      </div>

      <div className="h-[200px] border rounded-lg p-2 overflow-y-auto">
        <div className="grid grid-cols-6 gap-2">
          {filteredIcons.map((item) => {
            const Icon = item.icon;
            const isSelected = value === item.name;
            return (
              <Button
                key={item.name}
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onChange(item.name)}
                className={`h-12 w-12 ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950 border-2 border-blue-500"
                    : "hover:bg-accent"
                }`}
                title={item.name}
              >
                <Icon
                  className={`h-5 w-5 ${isSelected ? "text-blue-600" : ""}`}
                />
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
