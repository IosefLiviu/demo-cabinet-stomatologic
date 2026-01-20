import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role check to prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            checkAdminRole(session.user.id);
            checkDoctorAssociation(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setDoctorId(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminRole(session.user.id);
        checkDoctorAssociation(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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

  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      toast({
        title: 'Eroare la înregistrare',
        description: error.message,
        variant: 'destructive',
      });
      return { error };
    }

    toast({
      title: 'Cont creat cu succes!',
      description: 'Te-ai înregistrat cu succes.',
    });
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut face deconectarea.',
        variant: 'destructive',
      });
      return { error };
    }

    setUser(null);
    setSession(null);
    setIsAdmin(false);
    setDoctorId(null);
    return { error: null };
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    doctorId,
    signUp,
    signIn,
    signOut,
  };
}
