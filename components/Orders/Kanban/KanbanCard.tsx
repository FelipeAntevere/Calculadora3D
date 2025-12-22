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

export const KanbanCard: React.FC<KanbanCardProps & { dateField?: keyof Order }> = ({ order, index, onClick, onDelete }) => {
    // Timeline steps configuration
    const steps = [
        { label: 'Pedido', date: order.date, active: true, color: 'text-yellow-500' },
        { label: 'Produção', date: order.productionDate, active: !!order.productionDate, color: 'text-sky-500' },
        { label: 'Finalizado', date: order.completionDate, active: !!order.completionDate, color: 'text-emerald-500' },
        { label: 'Entregue', date: order.deliveryDate, active: !!order.deliveryDate, color: 'text-indigo-500' }
    ];

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
                                #{order.id.slice(0, 4)}
                            </span>
                        </div>

                        {/* Timeline Section */}
                        <div className="flex flex-col gap-1 py-2 border-t border-b border-slate-50">
                            {steps.map((step, i) => (
                                <div key={i} className={`flex justify-between items-center text-[10px] ${step.active ? 'opacity-100' : 'opacity-30'}`}>
                                    <div className="flex items-center gap-1.5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${step.active ? step.color.replace('text-', 'bg-') : 'bg-slate-300'}`}></div>
                                        <span className={`font-semibold ${step.active ? 'text-slate-600' : 'text-slate-400'}`}>{step.label}</span>
                                    </div>
                                    <span className="font-mono text-slate-500">
                                        {step.date ? formatDateTime(step.date) : '-'}
                                    </span>
                                </div>
                            ))}
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

                        <div className="flex items-center justify-between pt-2">
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
