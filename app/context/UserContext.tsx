// context/UserContext.tsx
'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface User {
    id: string;
    email?: string;
    // 其他用户属性
}

interface UserContextType {
    user: User | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
    user: null,
    isLoading: true,
});

export function UserProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({ id: user.id, email: user.email });
            }
            setIsLoading(false);
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email });
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, isLoading }}>
            {children}
        </UserContext.Provider>
    );
}

export const useUser = () => useContext(UserContext);