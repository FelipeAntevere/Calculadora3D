
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor: string;
  valueColorClass?: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, iconColor, valueColorClass = "text-slate-900", description }) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between transition-all hover:shadow-md h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800 text-sm font-bold">{title}</h3>
        <div className={`${iconColor}`}>
          {/* Fix: cast icon to ReactElement<any> to allow passing 'size' prop via cloneElement */}
          {React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
        </div>
      </div>
      <div className="space-y-1">
        <p className={`text-2xl font-black ${valueColorClass}`}>{value}</p>
        <p className="text-xs text-slate-400 font-medium">{description}</p>
      </div>
    </div>
  );
};

export default StatCard;
