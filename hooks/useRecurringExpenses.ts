import { useState, useEffect } from 'react';
import { RecurringExpenseTemplate } from '../types';

const RECURRING_EXPENSES_KEY = 'recurring_expense_templates';

export const useRecurringExpenses = () => {
    const [templates, setTemplates] = useState<RecurringExpenseTemplate[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(RECURRING_EXPENSES_KEY);
        if (stored) {
            try {
                setTemplates(JSON.parse(stored));
            } catch (e) {
                console.error('Failed to parse recurring expenses templates', e);
            }
        }
    }, []);

    const saveTemplates = (newTemplates: RecurringExpenseTemplate[]) => {
        localStorage.setItem(RECURRING_EXPENSES_KEY, JSON.stringify(newTemplates));
        setTemplates(newTemplates);
    };

    const addTemplate = (template: Omit<RecurringExpenseTemplate, 'id'>) => {
        const newTemplate: RecurringExpenseTemplate = {
            ...template,
            id: crypto.randomUUID()
        };
        const updated = [...templates, newTemplate];
        saveTemplates(updated);
    };

    const removeTemplate = (id: string) => {
        const updated = templates.filter(t => t.id !== id);
        saveTemplates(updated);
    };

    const updateTemplate = (updatedTemplate: RecurringExpenseTemplate) => {
        const updated = templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t);
        saveTemplates(updated);
    };

    return {
        templates,
        addTemplate,
        removeTemplate,
        updateTemplate
    };
};
