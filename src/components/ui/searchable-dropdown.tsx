import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface SearchableDropdownItem {
  id: string;
  label: string;
  code?: string;
  /** Extra text used only for search matching (optional). */
  searchText?: string;
}

export interface SearchableDropdownProps {
  items: SearchableDropdownItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectionMode?: "single" | "multi";
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  /** Extra classes for the popover panel (e.g. a width wider than the trigger). */
  contentClassName?: string;
  /** Popover alignment relative to the trigger. Defaults to "start". */
  align?: "start" | "center" | "end";
  /** Called when the popover opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Overrides the trigger text (e.g. "All campaigns" when every item is ticked). */
  triggerLabel?: string;
  /** Also match the search query against item ids. Turn off for opaque ids (e.g. UUIDs). Defaults to true. */
  matchIds?: boolean;
  /**
   * Max rows rendered in the open list. Keeps long lists usable.
   * Defaults to 200.
   */
  maxVisibleItems?: number;
  /** Optional custom row content (e.g. flag + name). */
  renderItem?: (item: SearchableDropdownItem, isSelected: boolean) => React.ReactNode;
}

const DEFAULT_MAX_VISIBLE = 200;

/**
 * Searchable single/multi select dropdown.
 * Selection updates via the same string[] contract as SearchableList.
 * Optimized for large lists: client-side filter + capped render (no virtualizer dep).
 */
export function SearchableDropdown({
  items,
  selectedIds,
  onSelectionChange,
  selectionMode = "single",
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found",
  disabled = false,
  className,
  contentClassName,
  align = "start",
  matchIds = true,
  triggerLabel: triggerLabelOverride,
  onOpenChange,
  maxVisibleItems = DEFAULT_MAX_VISIBLE,
  renderItem,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const itemsById = useMemo(() => {
    const map = new Map<string, SearchableDropdownItem>();
    for (const item of items) map.set(item.id, item);
    return map;
  }, [items]);

  const selectedLabels = useMemo(() => {
    return selectedIds
      .map((id) => itemsById.get(id)?.label ?? id)
      .filter(Boolean);
  }, [itemsById, selectedIds]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      if (item.label.toLowerCase().includes(q)) return true;
      if (matchIds && item.id.toLowerCase().includes(q)) return true;
      if (item.searchText?.toLowerCase().includes(q)) return true;
      if (item.code?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [items, query, matchIds]);

  const visibleItems = useMemo(() => {
    if (filteredItems.length <= maxVisibleItems) return filteredItems;
    return filteredItems.slice(0, maxVisibleItems);
  }, [filteredItems, maxVisibleItems]);

  const hiddenCount = Math.max(0, filteredItems.length - visibleItems.length);

  const triggerLabel =
    triggerLabelOverride ??
    (selectedLabels.length === 0
      ? placeholder
      : selectionMode === "single"
        ? selectedLabels[0]
        : selectedLabels.length === 1
          ? selectedLabels[0]
          : `${selectedLabels.length} selected`);

  const handleSelect = (rawValue: string) => {
    const match =
      itemsById.get(rawValue) ||
      items.find(
        (item) =>
          item.id.toLowerCase() === rawValue.toLowerCase() ||
          item.label.toLowerCase() === rawValue.toLowerCase(),
      );
    if (!match) return;

    if (selectionMode === "single") {
      onSelectionChange([match.id]);
      setOpen(false);
      setQuery("");
      return;
    }

    if (selectedSet.has(match.id)) {
      onSelectionChange(selectedIds.filter((id) => id !== match.id));
    } else {
      onSelectionChange([...selectedIds, match.id]);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setQuery("");
    onOpenChange?.(next);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal bg-white",
            selectedLabels.length === 0 && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("z-[100] w-[var(--radix-popover-trigger-width)] p-0 bg-white", contentClassName)}
        align={align}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* shouldFilter=false: we filter ourselves (cmdk default is slow for large lists) */}
        <Command shouldFilter={false} className="overflow-visible bg-white">
          <CommandInput
            placeholder={searchPlaceholder}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[280px] overflow-y-auto overscroll-contain">
            {filteredItems.length === 0 ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup className="overflow-visible">
                {visibleItems.map((item) => {
                  const isSelected = selectedSet.has(item.id);
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {renderItem ? (
                        renderItem(item, isSelected)
                      ) : (
                        <span className="truncate">{item.label}</span>
                      )}
                    </CommandItem>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    Showing {visibleItems.length} of {filteredItems.length}. Type to narrow results.
                  </div>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
