import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, Scale, Box, Trash2 } from 'lucide-react';
import { Order } from '../../../types';
import { formatDate, formatDateTime } from '../../../utils/formatters';

interface KanbanCardProps {
    order: Order;
    index: number;
    onClick: (order: Order) => void;
    onDelete: (id: string) => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({ order, index, onClick, onDelete }) => {
    return (
        <Draggable draggableId={order.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onClick={() => onClick(order)}
                    style={{
                        ...provided.draggableProps.style,
                    }}
                    className={`
                        bg-white p-4 rounded-xl border border-slate-100 shadow-sm
                        hover:shadow-md transition-all cursor-pointer group
                        ${snapshot.isDragging ? 'shadow-xl ring-2 ring-sky-500/20 rotate-2' : ''}
                    `}
                >
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm line-clamp-1" title={order.customer}>
                                    {order.customer}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium line-clamp-1" title={order.pieceName}>
                                    {order.pieceName}
                                </p>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                                {formatDateTime(order.date)}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                                <Box size={14} className="text-sky-500" />
                                <span className="font-semibold truncate">{order.material}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                                <Scale size={14} className="text-emerald-500" />
                                <span className="font-semibold">{order.weight}g</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                <Clock size={12} />
                                <span>{order.quantity} un.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-xs font-bold text-slate-700">
                                    R$ {order.total.toFixed(2)}
                                </div>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                                            onDelete(order.id);
                                        }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors relative z-10"
                                    title="Excluir Pedido"
                                >
                                    <Trash2 size={16} className="pointer-events-none" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
};
