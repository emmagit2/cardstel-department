import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Calendar as CalendarIcon, X, Filter } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function FilterBar({ 
  filters = [], 
  values = {}, 
  onChange,
  onReset,
  className 
}) {
  const handleChange = (key, value) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-xl p-4 shadow-sm",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-medium text-slate-700">Filters</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => {
          if (filter.type === "search") {
            return (
              <div key={filter.key} className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={filter.placeholder || "Search..."}
                  value={values[filter.key] || ""}
                  onChange={(e) => handleChange(filter.key, e.target.value)}
                  className="pl-9 h-10 border-slate-200"
                />
              </div>
            );
          }
          
          if (filter.type === "select") {
            return (
              <Select
                key={filter.key}
                value={values[filter.key] || "all"}
                onValueChange={(value) => handleChange(filter.key, value)}
              >
                <SelectTrigger className="w-[160px] h-10 border-slate-200">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options?.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
          
          if (filter.type === "date") {
            return (
              <Popover key={filter.key}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[160px] h-10 justify-start text-left font-normal border-slate-200",
                      !values[filter.key] && "text-slate-500"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {values[filter.key] ? format(new Date(values[filter.key]), "PP") : filter.placeholder}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={values[filter.key] ? new Date(values[filter.key]) : undefined}
                    onSelect={(date) => handleChange(filter.key, date?.toISOString())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            );
          }
          
          return null;
        })}
        
        {onReset && Object.keys(values).some(k => values[k] && values[k] !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-10 text-slate-500 hover:text-slate-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}