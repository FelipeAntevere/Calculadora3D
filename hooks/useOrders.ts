import { useState, useCallback } from 'react';
import { Order, OrderStatus } from '../types';
import { fetchOrders, upsertOrder, deleteOrder, updateOrderStatus } from '../services/dataService';

/**
 * Hook for managing orders data and operations.
 */
export const useOrders = (user: any) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    /**
     * Loads orders from the data service.
     */
    const loadOrders = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const data = await fetchOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Saves an order (creates or updates).
     */
    const saveOrder = async (order: Partial<Order>) => {
        try {
            const savedOrder = await upsertOrder(order);
            setOrders(prev => {
                const index = prev.findIndex(o => o.id === savedOrder.id);
                if (index >= 0) {
                    const newOrders = [...prev];
                    newOrders[index] = savedOrder;
                    return newOrders;
                }
                return [savedOrder, ...prev];
            });
            return savedOrder;
        } catch (error) {
            console.error('Error saving order:', error);
            throw error;
        }
    };

    /**
     * Deletes an order by ID.
     */
    const removeOrder = async (id: string) => {
        try {
            await deleteOrder(id);
            setOrders(prev => prev.filter(o => o.id !== id));
        } catch (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    };

    /**
     * Updates the status of an existing order.
     */
    const changeOrderStatus = async (id: string, status: OrderStatus) => {
        try {
            const updatedOrder = await updateOrderStatus(id, status);
            setOrders(prev => prev.map(o => o.id === id ? updatedOrder : o));
        } catch (error) {
            console.error('Error updating order status:', error);
            throw error;
        }
    };

    /**
     * Duplicates an existing order.
     */
    const duplicateOrder = async (order: Order) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...orderData } = order as any;
        return await saveOrder({
            ...orderData,
            customer: `${orderData.customer} (Cópia)`,
            date: new Date().toISOString().split('T')[0]
        });
    };

    return {
        orders,
        setOrders,
        isLoading,
        loadOrders,
        saveOrder,
        removeOrder,
        changeOrderStatus,
        duplicateOrder
    };
};
