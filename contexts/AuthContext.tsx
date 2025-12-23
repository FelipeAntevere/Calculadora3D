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

        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                fetchUserRole(session.user.id).finally(() => {
                    if (mounted) setIsLoading(false);
                });
            } else {
                setIsLoading(false);
            }
        });

        // Auth State Listener
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                // Only fetch role if we don't have it or if user changed (though user change implies session change usually)
                // Ideally we fetch every time to be safe on re-logins
                await fetchUserRole(session.user.id);
            } else {
                setUserRole(null);
            }
            setIsLoading(false);
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
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
