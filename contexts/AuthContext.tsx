import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

type UserRole = 'admin' | 'user' | null;

interface AuthContextType {
    user: User | null;
    session: Session | null;
    userRole: UserRole;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [userRole, setUserRole] = useState<UserRole>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Helper to fetch role
    const fetchUserRole = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                console.error('Error fetching role:', error);
                setUserRole('user'); // Default fallback
                return;
            }

            setUserRole((data?.role as UserRole) || 'user');
        } catch (err) {
            console.error('Unexpected error fetching role:', err);
            setUserRole('user');
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety Timeout: Force loading to false after 7 seconds if Supabase doesn't respond
        const safetyTimeout = setTimeout(() => {
            if (mounted && isLoading) {
                console.warn('AuthContext: Tempo de carregamento excedido (timeout). Forçando encerramento do loader.');
                setIsLoading(false);
            }
        }, 7000);

        const initAuth = async () => {
            try {
                // Check current session
                const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) throw sessionError;

                if (!mounted) return;

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    await fetchUserRole(initialSession.user.id);
                }
            } catch (err) {
                console.error('AuthContext: Erro na inicialização da sessão:', err);
                if (mounted) {
                    setUser(null);
                    setSession(null);
                    setUserRole(null);
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                    clearTimeout(safetyTimeout);
                }
            }
        };

        initAuth();

        // Auth State Listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!mounted) return;

            console.log(`AuthContext: Evento de Auth: ${event}`);

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchUserRole(session.user.id);
            } else {
                setUserRole(null);
            }

            // On sign in/out events we should also stop loading if it was somehow triggered
            setIsLoading(false);
            clearTimeout(safetyTimeout);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    // Temporary: Auto-update user profile name (Keep this logic here effectively)
    useEffect(() => {
        if (user && user.email === 'anteverefelipe92@gmail.com' && user.user_metadata?.full_name !== 'Felipe Viotti Antevere') {
            supabase.auth.updateUser({
                data: { full_name: 'Felipe Viotti Antevere' }
            }).then(({ data }) => {
                if (data.user) {
                    setUser(data.user);
                }
            });
        }
    }, [user]);

    const signInWithGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setUserRole(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, userRole, isLoading, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
