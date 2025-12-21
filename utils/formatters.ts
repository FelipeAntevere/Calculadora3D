/**
 * Utility functions for formatting data
 */

/**
 * Format a number as Brazilian currency (R$)
 */
export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Format a date string to Brazilian format (DD/MM/YYYY)
 */
export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0].split('-').reverse().join('/');
};

/**
 * Format a number with decimal places
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
};
