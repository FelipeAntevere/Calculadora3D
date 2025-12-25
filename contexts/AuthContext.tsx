import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Helper to fetch role
    // Helper to fetch role with retry
    const fetchUserRole = async (userId: string, retries = 2) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .maybeSingle();

            if (error) {
                if (retries > 0) {
                    console.warn(`Erro ao buscar role, tentando novamente... (${retries} restantes)`);
                    await new Promise(r => setTimeout(r, 1000));
                    return fetchUserRole(userId, retries - 1);
                }
                console.error('Error fetching role:', error);
                setUserRole('user'); // Default fallback
                return;
            }

            if (isMounted.current) {
                setUserRole((data?.role as UserRole) || 'user');
            }
        } catch (err) {
            console.error('Unexpected error fetching role:', err);
            if (isMounted.current) setUserRole('user');
        }
    };

    useEffect(() => {
        // Safety Timeout: Force loading to false after 4 seconds
        const safetyTimeout = setTimeout(() => {
            if (isMounted.current && isLoading) {
                console.warn('AuthContext: Tempo de carregamento excedido (4s). Forçando liberação da UI.');
                setIsLoading(false);
            }
        }, 4000);

        const initAuth = async (retries = 2) => {
            try {
                // Combined timeout for session fetch
                const sessionPromise = supabase.auth.getSession();
                const timeoutPromise = new Promise<{ data: { session: any }, error: any }>((_, reject) =>
                    setTimeout(() => reject(new Error('TIMEOUT')), 3000)
                );

                const { data: { session: initialSession }, error: sessionError } = await Promise.race([
                    sessionPromise,
                    timeoutPromise as any
                ]);

                if (sessionError) throw sessionError;

                if (!isMounted.current) return;

                setSession(initialSession);
                setUser(initialSession?.user ?? null);

                if (initialSession?.user) {
                    await fetchUserRole(initialSession.user.id);
                }
            } catch (err) {
                if (retries > 0 && isMounted.current) {
                    console.warn(`AuthContext: Falha ao obter sessão, tentando novamente... (${retries} restantes)`);
                    await new Promise(r => setTimeout(r, 1000));
                    return initAuth(retries - 1);
                }
                console.error('AuthContext: Erro na inicialização da sessão:', err);
                if (isMounted.current) {
                    setUser(null);
                    setSession(null);
                    setUserRole(null);
                }
            } finally {
                if (isMounted.current) {
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
            if (!isMounted.current) return;

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
