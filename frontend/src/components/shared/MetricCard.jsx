import React from 'react';
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = "default",
  className 
}) {
  const variants = {
    default: "bg-white border-slate-200",
    primary: "bg-gradient-to-br from-slate-800 to-slate-900 text-white border-slate-700",
    success: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
    warning: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
    danger: "bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200",
  };

  const iconVariants = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-white/10 text-white",
    success: "bg-emerald-500/10 text-emerald-600",
    warning: "bg-amber-500/10 text-amber-600",
    danger: "bg-rose-500/10 text-rose-600",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden p-6 border transition-all duration-300 hover:shadow-lg",
      variants[variant],
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn(
            "text-sm font-medium",
            variant === "primary" ? "text-slate-300" : "text-slate-500"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-3xl font-bold tracking-tight",
            variant === "primary" ? "text-white" : "text-slate-900"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className={cn(
              "text-xs",
              variant === "primary" ? "text-slate-400" : "text-slate-500"
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium mt-2",
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            )}>
              {trend === "up" ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-3 rounded-xl",
            iconVariants[variant]
          )}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Decorative element */}
      <div className={cn(
        "absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10",
        variant === "primary" ? "bg-white" : "bg-slate-900"
      )} />
    </Card>
  );
}