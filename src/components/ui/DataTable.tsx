import { useState, useMemo, type ReactNode } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { EmptyState } from './EmptyState';

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  pageSize?: number;
  cardRenderer?: (item: T) => ReactNode;
  emptyState?: ReactNode;
}

function DataTable<T>({
  columns,
  data,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Caută...',
  pageSize = 20,
  cardRenderer,
  emptyState,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const { isMobile } = useIsMobile();

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const { pageIndex } = table.getState().pagination;
  const totalRows = table.getFilteredRowModel().rows.length;
  const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalRows);
  const pageCount = table.getPageCount();

  // Sortable column options for mobile dropdown
  const sortableColumns = useMemo(() => {
    return columns
      .filter((col) => col.enableSorting !== false)
      .map((col) => {
        const id = (col as any).accessorKey ?? (col as any).id ?? '';
        const header = typeof col.header === 'string' ? col.header : String(id);
        return { value: String(id), label: header };
      })
      .filter((c) => c.value);
  }, [columns]);

  // Current sort value for dropdown
  const currentSortValue = sorting.length > 0 ? `${sorting[0].id}:${sorting[0].desc ? 'desc' : 'asc'}` : '';

  const handleSortChange = (value: string) => {
    if (!value) {
      setSorting([]);
      return;
    }
    const [id, dir] = value.split(':');
    setSorting([{ id, desc: dir === 'desc' }]);
  };

  // Build sort dropdown options
  const sortOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    for (const col of sortableColumns) {
      opts.push({ value: `${col.value}:asc`, label: `${col.label} ↑` });
      opts.push({ value: `${col.value}:desc`, label: `${col.label} ↓` });
    }
    return opts;
  }, [sortableColumns]);

  // Generate compact page number array
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    if (pageCount <= 7) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
    } else {
      pages.push(0);
      if (pageIndex > 2) pages.push('ellipsis');
      const start = Math.max(1, pageIndex - 1);
      const end = Math.min(pageCount - 2, pageIndex + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (pageIndex < pageCount - 3) pages.push('ellipsis');
      pages.push(pageCount - 1);
    }
    return pages;
  }, [pageIndex, pageCount]);

  const showMobileCards = isMobile && !!cardRenderer;

  // Search bar (shared between table and card views)
  const searchBar = searchable && (
    <div className="px-3 py-2.5 border-b border-border">
      <div className="relative max-w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full h-10 sm:h-8 pl-8 pr-3 rounded-[6px] border border-border bg-bg-primary text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>
    </div>
  );

  // Pagination (shared, with larger touch targets on mobile cards)
  const pagination = totalRows > pageSize && (
    <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-bg-secondary">
      <span className="text-xs text-text-secondary">
        Afișează {startRow}–{endRow} din {totalRows}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className={[
            'flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors',
            showMobileCards ? 'min-h-[44px] min-w-[44px]' : 'size-7',
          ].join(' ')}
          aria-label="Pagina anterioară"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        {pageNumbers.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-xs text-text-tertiary">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => table.setPageIndex(p)}
              className={[
                'flex items-center justify-center px-1.5 rounded-[4px] text-xs font-medium transition-colors',
                showMobileCards ? 'min-h-[44px] min-w-[44px]' : 'min-w-7 h-7',
                p === pageIndex
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
              ].join(' ')}
            >
              {p + 1}
            </button>
          )
        )}
        <button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className={[
            'flex items-center justify-center rounded-[4px] text-text-secondary hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none transition-colors',
            showMobileCards ? 'min-h-[44px] min-w-[44px]' : 'size-7',
          ].join(' ')}
          aria-label="Pagina următoare"
        >
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  );

  if (showMobileCards) {
    return (
      <div className="flex flex-col border border-border rounded-[6px] overflow-hidden bg-bg-primary">
        {searchBar}

        {/* Sort dropdown */}
        {sortOptions.length > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <select
              value={currentSortValue}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full h-9 rounded-[6px] border border-border bg-bg-primary text-text-primary text-[13px] appearance-none pl-3 pr-8 cursor-pointer focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
            >
              <option value="">Sortare implicită</option>
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Card list */}
        <div className="p-3 space-y-2">
          {table.getRowModel().rows.length === 0 ? (
            emptyState ?? <EmptyState title="Nu sunt date disponibile" />
          ) : (
            table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer' : undefined}
              >
                {cardRenderer(row.original)}
              </div>
            ))
          )}
        </div>

        {pagination}
      </div>
    );
  }

  return (
    <div className="flex flex-col border border-border rounded-[6px] overflow-hidden bg-bg-primary">
      {searchBar}

      {/* Table */}
      <div className="overflow-x-auto touch-pan-x">
        <table className="w-full border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-bg-secondary">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className={[
                        'h-8 px-3 text-left text-[11px] font-medium uppercase tracking-wider text-text-secondary',
                        'border-b border-border whitespace-nowrap',
                        canSort && 'cursor-pointer select-none hover:text-text-primary',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-text-tertiary">
                            {sorted === 'asc' ? (
                              <ArrowUp className="size-3" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="size-3" />
                            ) : (
                              <ArrowUpDown className="size-3 opacity-40" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  {emptyState ?? <EmptyState title="Nu sunt date disponibile" />}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className={[
                    'border-b border-border last:border-b-0',
                    'hover:bg-bg-tertiary transition-colors duration-75',
                    onRowClick && 'cursor-pointer',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="h-[38px] px-3 text-[13px] text-text-primary whitespace-nowrap"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination}
    </div>
  );
}

export { DataTable };
export type { DataTableProps };
