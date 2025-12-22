import React from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Order, OrderStatus } from '../../../types';
import { KanbanColumn } from './KanbanColumn';

interface KanbanBoardProps {
    orders: Order[];
    statusOptions: string[];
    onDragEnd: (result: DropResult) => void;
    onCardClick: (order: Order) => void;
    getStatusStyle: (status: OrderStatus) => string;
    onDelete: (id: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
    orders,
    statusOptions,
    onDragEnd,
    onCardClick,
    getStatusStyle,
    onDelete
}) => {
    return (
        <div className="flex-1 overflow-x-auto h-full">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 h-full min-h-[600px] pb-4 px-2 w-full">
                    {statusOptions.map((status) => {
                        const statusOrders = orders.filter(o => o.status === status);
                        return (
                            <KanbanColumn
                                key={status}
                                status={status}
                                orders={statusOrders}
                                onCardClick={onCardClick}
                                colorFn={getStatusStyle}
                                onDelete={onDelete}
                            />
                        );
                    })}
                </div>
            </DragDropContext>
        </div>
    );
};
