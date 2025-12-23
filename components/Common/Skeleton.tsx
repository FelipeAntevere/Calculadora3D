import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'rectangular' | 'circular' | 'text';
    width?: string | number;
    height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rectangular',
    width,
    height
}) => {
    const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700';
    const variantClasses = {
        rectangular: 'rounded-xl',
        circular: 'rounded-full',
        text: 'rounded-md h-4 w-full'
    };

    const style: React.CSSProperties = {
        width: width,
        height: height
    };

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
        />
    );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
    return (
        <div className="w-full space-y-4">
            <div className="flex gap-4 mb-6">
                <Skeleton width="100px" height="40px" />
                <Skeleton width="150px" height="40px" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-[32px] border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-50 dark:border-slate-700 flex justify-between">
                    <Skeleton width="30%" height="20px" />
                    <Skeleton width="10%" height="20px" />
                </div>
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                    {Array.from({ length: rows }).map((_, i) => (
                        <div key={i} className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4 w-1/3">
                                <Skeleton variant="circular" width="40px" height="40px" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton width="60%" height="15px" />
                                    <Skeleton width="40%" height="10px" />
                                </div>
                            </div>
                            <Skeleton width="15%" height="15px" />
                            <Skeleton width="15%" height="15px" />
                            <Skeleton width="10%" height="30px" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
            <div className="space-y-3 w-2/3">
                <Skeleton width="40%" height="10px" />
                <Skeleton width="80%" height="25px" />
            </div>
            <Skeleton variant="circular" width="60px" height="60px" />
        </div>
    );
};
