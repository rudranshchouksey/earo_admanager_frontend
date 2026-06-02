import * as React from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// ──────────────────────────── Types ────────────────────────────

export interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  render?: (value: T[keyof T], item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface SearchableListProps<T> {
  items: T[];
  totalCount?: number;
  loading?: boolean;

  columns: Column<T>[];
  renderItem?: (item: T, isSelected: boolean) => React.ReactNode;

  selectionMode: 'single' | 'multi' | 'none';
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  selectAllFiltered?: boolean;
  idKey?: keyof T & string;

  searchPlaceholder?: string;
  searchableKeys?: (keyof T & string)[];
  rotatingLabels?: string[];

  /**
   * When true, the list will NOT filter `items` by the search query.
   * Instead, it will forward the query to `onQueryChange` so the parent can fetch results from an API.
   */
  useFilterApi?: boolean;
  onQueryChange?: (query: string) => void;
  queryDebounceMs?: number;
  /** API-backed infinite scroll */
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;

  filters?: FilterDef[];

  defaultSort?: { key: keyof T & string; dir: 'asc' | 'desc' };

  pageSize?: number;
  paginationMode?: 'pagination' | 'infinite-scroll';

  variant?: 'table' | 'list';
  maxHeight?: string;
  emptyMessage?: string;

  /** Collapsible trigger — shows a compact bar that expands on click */
  collapsible?: boolean;
  collapsibleIcon?: React.ReactNode;
  collapsibleLabel?: string;
  defaultOpen?: boolean;

  /** Controlled open state for accordion behavior */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

// ──────────────────────────── Component ────────────────────────────

export function SearchableList<T extends Record<string, any>>({
  items,
  totalCount,
  loading = false,
  columns,
  renderItem,
  selectionMode,
  selectedIds,
  onSelectionChange,
  selectAllFiltered = false,
  idKey = 'id' as keyof T & string,
  searchPlaceholder,
  searchableKeys,
  rotatingLabels,
  useFilterApi = false,
  onQueryChange,
  queryDebounceMs = 300,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  filters,
  defaultSort,
  pageSize = 20,
  paginationMode = 'pagination',
  variant = 'table',
  maxHeight = '400px',
  emptyMessage = 'No items found',
  collapsible = false,
  collapsibleIcon,
  collapsibleLabel,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onOpenChange,
  disabled = false,
}: SearchableListProps<T>) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = useCallback((valOrFn: boolean | ((prev: boolean) => boolean)) => {
    const next = typeof valOrFn === 'function' ? valOrFn(isOpen) : valOrFn;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(next);
    }
    onOpenChange?.(next);
  }, [controlledIsOpen, isOpen, onOpenChange]);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(defaultSort ?? null);
  const [page, setPage] = useState(1);
  const [rotatingIndex, setRotatingIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const getScrollViewport = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return null;
    return root;
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!collapsible || !isOpen) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [collapsible, isOpen]);

  // Scroll into view when opened
  useEffect(() => {
    if (collapsible && isOpen && wrapperRef.current) {
      // Small delay to let sibling lists collapse first
      const timeout = setTimeout(() => {
        wrapperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [collapsible, isOpen]);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Rotating placeholder
  useEffect(() => {
    if (!rotatingLabels?.length || query.length > 0) return;
    const interval = setInterval(() => {
      setRotatingIndex((prev) => (prev + 1) % rotatingLabels.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [rotatingLabels, query]);

  // Resolve searchable keys
  const resolvedSearchKeys = useMemo(() => {
    if (searchableKeys?.length) return searchableKeys;
    return columns.filter((c) => c.searchable !== false).map((c) => c.key);
  }, [searchableKeys, columns]);

  // Forward query to parent (debounced) when API-driven filtering is enabled
  useEffect(() => {
    if (!useFilterApi) return;
    if (!onQueryChange) return;
    const t = setTimeout(() => onQueryChange(query), queryDebounceMs);
    return () => clearTimeout(t);
  }, [query, useFilterApi, onQueryChange, queryDebounceMs]);

  // Filter + search
  const filteredItems = useMemo(() => {
    let result = [...items];

    // Text search
    if (!useFilterApi && query.length > 0) {
      const q = query.toLowerCase();
      result = result.filter((item) =>
        resolvedSearchKeys.some((key) => {
          const val = item[key];
          return val != null && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Active filters
    Object.entries(activeFilters).forEach(([filterKey, filterValue]) => {
      if (!filterValue) return;
      result = result.filter((item) => {
        const val = item[filterKey as keyof T];
        return val != null && String(val).toLowerCase() === filterValue.toLowerCase();
      });
    });

    // Sort
    if (sort) {
      result.sort((a, b) => {
        const aVal = a[sort.key as keyof T];
        const bVal = b[sort.key as keyof T];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [items, query, activeFilters, sort, resolvedSearchKeys, useFilterApi]);

  // Paginated / infinite items
  const displayedItems = useMemo(() => {
    if (paginationMode === 'infinite-scroll') {
      // In API-backed mode, parent controls the items; show everything fetched so far.
      if (useFilterApi) return filteredItems;
      return filteredItems.slice(0, visibleCount);
    }
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize, paginationMode, visibleCount, useFilterApi]);

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const total = totalCount ?? items.length;

  // Infinite scroll observer
  useEffect(() => {
    if (paginationMode !== 'infinite-scroll' || !sentinelRef.current) return;
    const viewport = getScrollViewport();
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;

      // API-backed infinite scroll
      if (useFilterApi) {
        if (!onLoadMore || loading || loadingMore || !hasMore) return;
        onLoadMore();
        return;
      }

      // Local infinite scroll (reveal more from already-loaded items)
      if (visibleCount < filteredItems.length) {
        setVisibleCount((prev) => Math.min(prev + pageSize, filteredItems.length));
      }
    }, { threshold: 0.1, root: viewport });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [
    paginationMode,
    useFilterApi,
    onLoadMore,
    hasMore,
    loading,
    loadingMore,
    visibleCount,
    filteredItems.length,
    pageSize,
    getScrollViewport,
  ]);

  // If API results don't overflow yet, prefetch until scroll becomes possible (or no more pages).
  useEffect(() => {
    if (paginationMode !== 'infinite-scroll') return;
    if (!useFilterApi) return;
    if (!onLoadMore || loading || loadingMore || !hasMore) return;

    const viewport = getScrollViewport();
    if (!viewport) return;
    const notScrollable = viewport.scrollHeight <= viewport.clientHeight + 4;
    if (notScrollable) onLoadMore();
  }, [
    paginationMode,
    useFilterApi,
    onLoadMore,
    hasMore,
    loading,
    loadingMore,
    items.length,
    getScrollViewport,
  ]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
    setVisibleCount(pageSize);
  }, [query, activeFilters, pageSize]);

  // Selection helpers
  const toggleItem = useCallback(
    (itemId: string) => {
      if (selectionMode === 'none') return;
      if (selectionMode === 'single') {
        const isDeselecting = selectedIds.includes(itemId);
        onSelectionChange(isDeselecting ? [] : [itemId]);
        // Auto-collapse on single-select pick
        if (collapsible && !isDeselecting) {
          setIsOpen(false);
        }
      } else {
        onSelectionChange(
          selectedIds.includes(itemId)
            ? selectedIds.filter((id) => id !== itemId)
            : [...selectedIds, itemId]
        );
      }
    },
    [selectionMode, selectedIds, onSelectionChange, collapsible]
  );

  const filteredIds = useMemo(() => filteredItems.map((item) => String(item[idKey])), [filteredItems, idKey]);

  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

  const toggleSelectAllFiltered = useCallback(() => {
    if (allFilteredSelected) {
      onSelectionChange(selectedIds.filter((id) => !filteredIds.includes(id)));
    } else {
      const merged = new Set([...selectedIds, ...filteredIds]);
      onSelectionChange(Array.from(merged));
    }
  }, [allFilteredSelected, filteredIds, selectedIds, onSelectionChange]);

  const removeSelected = useCallback(
    (id: string) => {
      onSelectionChange(selectedIds.filter((s) => s !== id));
    },
    [selectedIds, onSelectionChange]
  );

  const toggleSort = useCallback(
    (key: string) => {
      setSort((prev) => {
        if (prev?.key === key) {
          return prev.dir === 'asc' ? { key, dir: 'desc' } : null;
        }
        return { key, dir: 'asc' };
      });
    },
    []
  );

  const placeholder = rotatingLabels?.length
    ? `Search for ${rotatingLabels[rotatingIndex]}...`
    : searchPlaceholder || 'Search...';

  // Get display labels for selected items
  const selectedItemLabels = useMemo(() => {
    const nameCol = columns[0]?.key;
    return selectedIds.map((id) => {
      const item = items.find((i) => String(i[idKey]) === id);
      return { id, label: item ? String(item[nameCol] ?? id) : id };
    });
  }, [selectedIds, items, idKey, columns]);

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort?.key !== colKey) return <ChevronsUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sort.dir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-primary" />
    ) : (
      <ChevronDown className="h-3 w-3 text-primary" />
    );
  };

  // Collapsible trigger bar
  const triggerBar = collapsible ? (
    <div
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background text-sm transition-colors',
        isOpen && 'rounded-b-none border-b-primary/30'
      )}
    >
      {collapsibleIcon && (
        <span className="text-muted-foreground shrink-0">{collapsibleIcon}</span>
      )}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => !disabled ? setIsOpen((o) => !o) : undefined}
      >
        {selectedIds.length > 0 ? (
          <span className="flex flex-wrap gap-1.5">
            {selectedItemLabels.map(({ id, label }) => (
              <span
                key={id}
                className={`inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium pl-2.5 pr-1 py-1 rounded-full ${disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
              >
                <span className="truncate max-w-[160px]">{label}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSelected(id);
                  }}
                  className="text-primary/60 hover:text-primary ml-0.5"
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {collapsibleLabel || searchPlaceholder || 'Select...'}
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled ? setIsOpen((o) => !o) : undefined}
        className="text-muted-foreground shrink-0"
      >
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
    </div>
  ) : null;

  if (collapsible && !isOpen) {
    return <div ref={wrapperRef}>{triggerBar}</div>;
  }

  return (
    <div ref={wrapperRef} className={cn(collapsible && 'border border-border rounded-lg border-t-0')}>
      {triggerBar}
      <div className={cn('space-y-3', collapsible && 'p-3')}>
      {/* Search + Filters row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`pl-9 pr-9 h-10 ${disabled ? 'opacity-80 cursor-not-allowed' : ''}`}
            placeholder={placeholder}
            disabled={disabled}
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {filters?.map((filter) => (
          <Select
            key={filter.key}
            value={activeFilters[filter.key] || 'all'}
            onValueChange={(v) =>
              setActiveFilters((prev) => ({ ...prev, [filter.key]: v === 'all' ? '' : v }))
            }
            disabled={disabled}            
          >
            <SelectTrigger className="h-10 w-auto min-w-[130px]">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Selected chips — only show when NOT collapsible (collapsible shows them in trigger bar) */}
      {!collapsible && selectionMode !== 'none' && selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedItemLabels.map(({ id, label }) => (
            <Badge
              key={id}
              variant="secondary"
              className="gap-1 pr-1 cursor-default"
            >
              <span className="text-xs truncate max-w-[120px]">{label}</span>
              <button
                type="button"
                onClick={() => removeSelected(id)}
                className="ml-0.5 hover:text-destructive transition-colors"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Table variant */}
      {variant === 'table' ? (
        <div className="border rounded-lg overflow-hidden">
          <div style={{ maxHeight }} ref={scrollRef} className="overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border sticky top-0 z-10">
                    {selectionMode !== 'none' && (
                      <th className="w-10 px-3 py-2.5">
                        {selectionMode === 'multi' && selectAllFiltered && (
                          <Checkbox
                            checked={allFilteredSelected}
                            onCheckedChange={toggleSelectAllFiltered}
                            disabled={disabled}
                          />
                        )}
                      </th>
                    )}
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          'text-left px-3 py-2.5 font-medium text-muted-foreground whitespace-nowrap',
                          col.sortable && 'cursor-pointer select-none hover:text-foreground',
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.className
                        )}
                        onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                      >
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {col.sortable && <SortIcon colKey={col.key} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border ">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={columns.length + (selectionMode !== 'none' ? 1 : 0)}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : displayedItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + (selectionMode !== 'none' ? 1 : 0)}
                        className="px-3 py-8 text-center text-muted-foreground"
                      >
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    displayedItems.map((item) => {
                      const itemId = String(item[idKey]);
                      const isSelected = selectedIds.includes(itemId);
                      return (
                        <tr
                          key={itemId}
                          onClick={() => toggleItem(itemId)}
                          className={cn(
                            'transition-colors',
                            selectionMode !== 'none' && 'cursor-pointer hover:bg-accent/50',
                            isSelected && 'bg-primary/5'
                          )}
                        >
                          {selectionMode !== 'none' && (
                            <td className="px-3 py-2.5">
                              <Checkbox checked={isSelected} tabIndex={-1} />
                            </td>
                          )}
                          {columns.map((col) => (
                            <td
                              key={col.key}
                              className={cn(
                                'px-3 py-2.5',
                                col.hideOnMobile && 'hidden md:table-cell',
                                col.className
                              )}
                            >
                              {col.render
                                ? col.render(item[col.key], item)
                                : String(item[col.key] ?? '')}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {paginationMode === 'infinite-scroll' && (
              <div ref={sentinelRef} className="h-4" />
            )}
          </div>
        </div>
      ) : (
        /* List variant */
        <div style={{ maxHeight }} ref={scrollRef} className="overflow-auto">
          <div className="space-y-1">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
            ) : displayedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{emptyMessage}</p>
            ) : (
              displayedItems.map((item) => {
                const itemId = String(item[idKey]);
                const isSelected = selectedIds.includes(itemId);
                if (renderItem) {
                  return (
                    <div
                      key={itemId}
                      onClick={() => toggleItem(itemId)}
                      className="cursor-pointer"
                    >
                      {renderItem(item, isSelected)}
                    </div>
                  );
                }
                // Default list rendering
                const primaryCol = columns[0];
                const secondaryCol = columns[1];
                return (
                  <button
                    key={itemId}
                    type="button"
                    onClick={() => toggleItem(itemId)}
                    className={cn(
                      'flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left transition-colors',
                      isSelected ? 'bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
                    )}
                  >
                    {selectionMode !== 'none' && (
                      <Checkbox checked={isSelected} tabIndex={-1} className="shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">
                        {primaryCol ? String(item[primaryCol.key] ?? '') : itemId}
                      </span>
                      {secondaryCol && (
                        <p className="text-xs text-muted-foreground truncate">
                          {String(item[secondaryCol.key] ?? '')}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          {paginationMode === 'infinite-scroll' && (
            <div ref={sentinelRef} className="h-4" />
          )}
        </div>
      )}

      {/* Footer status bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredItems.length === total
            ? `${total} item${total !== 1 ? 's' : ''}`
            : `${filteredItems.length} of ${total}`}
          {selectionMode !== 'none' && selectedIds.length > 0 && (
            <> · {selectedIds.length} selected</>
          )}
        </span>

        {paginationMode === 'pagination' && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
