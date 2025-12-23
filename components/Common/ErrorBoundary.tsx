import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * ErrorBoundary catches runtime errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application.
 */
export class ErrorBoundary extends React.Component<Props, State> {
    state: State = {
        hasError: false
    };

    constructor(props: Props) {
        super(props);
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
                    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl p-12 text-center border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>

                        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-4">
                            Ops! Algo deu errado.
                        </h2>

                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-10">
                            Ocorreu um erro inesperado. Isso pode acontecer devido a uma perda temporária de conexão ou se o sistema ficou inativo por muito tempo.
                        </p>

                        <button
                            onClick={this.handleReset}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-[#0ea5e9] text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-[#0284c7] shadow-xl shadow-sky-100 dark:shadow-none transition-all active:scale-95"
                        >
                            <RefreshCw className="w-5 h-5" />
                            Recarregar Aplicativo
                        </button>

                        {this.state.error && (
                            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
                                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-mono break-all opacity-50">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Utility to wrap React.lazy with a retry mechanism. 
 * Particularly useful for handling ChunkLoadErrors when a server restarts or network is unstable.
 */
export const lazyWithRetry = (componentImport: () => Promise<any>) =>
    React.lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.localStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            const component = await componentImport();
            window.localStorage.setItem('page-has-been-force-refreshed', 'false');
            return component;
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // First failure: try to refresh the page to get the latest chunks
                window.localStorage.setItem('page-has-been-force-refreshed', 'true');
                return window.location.reload();
            }

            // If we already refreshed and it still fails, let the error boundary handle it
            throw error;
        }
    });
