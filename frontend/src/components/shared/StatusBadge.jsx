import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  // General statuses
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-slate-50 text-slate-700 border-slate-200",
  ended: "bg-slate-50 text-slate-700 border-slate-200",
  
  // Telcom statuses
  "malating ongoing": "bg-purple-50 text-purple-700 border-purple-200",
  "fully packed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  reconciled: "bg-blue-50 text-blue-700 border-blue-200",
  
  // Payment statuses
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-50 text-rose-700 border-rose-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  
  // Boolean statuses
  true: "bg-emerald-50 text-emerald-700 border-emerald-200",
  false: "bg-slate-50 text-slate-700 border-slate-200",
  
  // Shifts
  morning: "bg-sky-50 text-sky-700 border-sky-200",
  afternoon: "bg-orange-50 text-orange-700 border-orange-200",
  night: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function StatusBadge({ status, className }) {
  const normalizedStatus = String(status).toLowerCase();
  const style = statusStyles[normalizedStatus] || "bg-slate-50 text-slate-700 border-slate-200";
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium capitalize border",
        style,
        className
      )}
    >
      {status}
    </Badge>
  );
}