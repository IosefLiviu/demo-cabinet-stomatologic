import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  doctorId: string | null;
  displayName: string | null;
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        // Ignore token refresh events that don't change the user
        // This prevents unnecessary re-renders and state updates
        if (event === 'TOKEN_REFRESHED' && session?.user) {
          setSession(session);
          return;
        }

        // For SIGNED_OUT, only process if it's a real logout (not a failed refresh)
        if (event === 'SIGNED_OUT') {
          // Double-check: if we had a user, verify the session is truly gone
          // before logging out (protects against rate-limit induced logouts)
          if (user) {
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
              if (!mounted) return;
              if (!currentSession) {
                // Truly signed out
                setSession(null);
                setUser(null);
                setIsAdmin(false);
                setDoctorId(null);
                setMustChangePassword(false);
                setDisplayName(null);
              } else {
                // False alarm - session still valid, restore it
                setSession(currentSession);
              }
            });
            return;
          }
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setDoctorId(null);
          setMustChangePassword(false);
          setDisplayName(null);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            if (!mounted) return;
            checkAdminRole(session.user.id);
            checkDoctorAssociation(session.user.id);
            checkMustChangePassword(session.user.id);
            fetchDisplayName(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setDoctorId(null);
          setMustChangePassword(false);
          setDisplayName(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkAdminRole(session.user.id);
        checkDoctorAssociation(session.user.id);
        checkMustChangePassword(session.user.id);
        fetchDisplayName(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) throw error;
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
    }
  };

  const checkDoctorAssociation = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setDoctorId(data?.id || null);
    } catch (error) {
      console.error('Error checking doctor association:', error);
      setDoctorId(null);
    }
  };

  const checkMustChangePassword = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('must_change_password')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setMustChangePassword(data?.must_change_password !== false);
    } catch (error) {
      console.error('Error checking password change requirement:', error);
      setMustChangePassword(false);
    }
  };

  const fetchDisplayName = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setDisplayName(data?.full_name || data?.username || null);
    } catch (error) {
      console.error('Error fetching display name:', error);
      setDisplayName(null);
    }
  };

  const clearMustChangePassword = () => {
    setMustChangePassword(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        title: 'Eroare la autentificare',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }
    toast({
      title: 'Bine ai venit!',
      description: 'Te-ai autentificat cu succes.',
    });
    return { error: null };
  };

  const signOut = async () => {
    // Always clear local state, even if server signOut fails
    // (e.g. session already expired/deleted on server)
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('SignOut request failed, clearing local state anyway:', e);
    }
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setDoctorId(null);
    setMustChangePassword(false);
    setDisplayName(null);
    return { error: null };
  };

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAdmin, doctorId, displayName,
      mustChangePassword, clearMustChangePassword, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
