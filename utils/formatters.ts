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
 * Format a date string to Brazilian format with time (DD/MM/YYYY HH:mm)
 */
export const formatDateTime = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return formatDate(dateString); // Fallback if invalid

    // If it's a simple YYYY-MM-DD string without time, return just date
    if (dateString.length === 10) return formatDate(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

/**
 * Format a number with decimal places
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
    return value.toFixed(decimals);
};

/**
 * Format an ISO date string to input datetime-local format (YYYY-MM-DDTHH:mm)
 * Adjusts correctly for local timezone.
 */
export const toLocalInputDate = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';

    // Calculate offset in milliseconds
    const offset = date.getTimezoneOffset() * 60000;
    // Create a new date adjusted by the offset to get the local time representation in UTC
    const localDate = new Date(date.getTime() - offset);

    return localDate.toISOString().slice(0, 16);
};
