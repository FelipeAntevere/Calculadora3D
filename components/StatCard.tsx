
import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  valueColorClass?: string;
  description: string;
  variation?: {
    value: number;
    isPositive: boolean;
    isNeutral?: boolean;
  };
  comparisonLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  valueColorClass = "text-slate-900",
  description,
  variation,
  comparisonLabel
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800 text-sm font-bold">{title}</h3>
        <div className={`${iconColor}`}>
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className={`text-2xl font-black ${valueColorClass}`}>{value}</p>
          {variation && (
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${variation.isNeutral ? 'bg-slate-100 text-slate-500' :
                variation.isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
              {variation.isNeutral ? <Minus size={10} /> : variation.isPositive ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {variation.value.toFixed(1)}%
            </div>
          )}
        </div>

        <div className="flex flex-col gap-0.5">
          <p className="text-xs text-slate-400 font-medium">{description}</p>
          {comparisonLabel && (
            <p className="text-[10px] text-slate-400 italic">vs {comparisonLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
