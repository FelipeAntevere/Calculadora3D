import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Order } from '../../../types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
    status: string;
    orders: Order[];
    onCardClick: (order: Order) => void;
    colorFn: (status: any) => string;
    onDelete: (id: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, orders, onCardClick, colorFn, onDelete }) => {
    // Determine header color based on status (simplified mapping or use the passed function)
    const getHeaderColor = () => {
        if (status === 'Pedidos') return 'bg-yellow-500';
        if (status === 'Produção') return 'bg-blue-500';
        if (status === 'Finalizado') return 'bg-emerald-500';
        if (status === 'Entregue') return 'bg-slate-500';
        if (status === 'Cancelado') return 'bg-red-500';
        return 'bg-slate-400';
    };

    return (
        <div className="flex flex-col h-full flex-1 min-w-[200px] bg-slate-50/50 rounded-2xl border border-slate-100/50 overflow-hidden">
            {/* Header */}
            <div className={`px-4 py-3 flex items-center justify-between bg-white border-b border-slate-100`}>
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${getHeaderColor()}`}></div>
                    <span className="font-bold text-slate-700 text-sm uppercase tracking-wider">{status}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {orders.length}
                </span>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`
                            flex-1 p-3 flex flex-col gap-3 overflow-y-auto no-scrollbar transition-colors
                            ${snapshot.isDraggingOver ? 'bg-sky-50/50' : ''}
                        `}
                        style={{ minHeight: '200px' }}
                    >
                        {orders.map((order, index) => (
                            <KanbanCard
                                key={order.id}
                                order={order}
                                index={index}
                                onClick={onCardClick}
                                onDelete={onDelete}
                                dateField={
                                    status === 'Produção' ? 'productionDate' :
                                        status === 'Finalizado' ? 'completionDate' :
                                            status === 'Entregue' ? 'deliveryDate' :
                                                'date'
                                }
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
