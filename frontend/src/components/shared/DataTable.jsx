import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

export default function DataTable({ 
  columns, 
  data, 
  sortable = true,
  onRowClick,
  emptyMessage = "No data available",
  highlightCondition,
  className 
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-slate-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-slate-700" />
      : <ChevronDown className="w-4 h-4 text-slate-700" />;
  };

  const renderCell = (row, column) => {
    const value = column.accessor ? column.accessor(row) : row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }
    
    if (column.type === 'status') {
      return <StatusBadge status={value} />;
    }
    
    if (column.type === 'number') {
      return (
        <span className="font-mono text-sm">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );
    }
    
    if (column.type === 'currency') {
      return (
        <span className="font-mono text-sm">
          ₦{typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );
    }
    
    if (column.type === 'date') {
      if (!value) return '-';
      return new Date(value).toLocaleDateString();
    }
    
    if (column.type === 'datetime') {
      if (!value) return '-';
      return new Date(value).toLocaleString();
    }
    
    return value ?? '-';
  };

  return (
    <div className={cn("bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={cn(
                    "text-slate-700 font-semibold whitespace-nowrap",
                    sortable && column.sortable !== false && "cursor-pointer select-none"
                  )}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortable && column.sortable !== false && <SortIcon columnKey={column.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-slate-500">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, idx) => {
                const isHighlighted = highlightCondition ? highlightCondition(row) : false;
                return (
                  <TableRow 
                    key={row.id || idx}
                    className={cn(
                      "transition-colors",
                      onRowClick && "cursor-pointer hover:bg-slate-50",
                      isHighlighted && "bg-rose-50/50 hover:bg-rose-50"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {isHighlighted && column.key === columns[0].key && (
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                          )}
                          {renderCell(row, column)}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}