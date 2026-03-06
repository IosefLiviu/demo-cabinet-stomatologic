import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import demoLogo from '@/assets/demo-logo.svg';

const usernameSchema = z.string().min(3, 'Numele de utilizator trebuie să aibă minim 3 caractere');
const passwordSchema = z.string().min(6, 'Parola trebuie să aibă minim 6 caractere');

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});

  useEffect(() => {
    if (!loading && user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {};

    const usernameResult = usernameSchema.safeParse(username);
    if (!usernameResult.success) {
      newErrors.username = usernameResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const logLoginAttempt = async (userId: string | null, success: boolean, errorMessage: string | null) => {
    try {
      await supabase.functions.invoke('log-login', {
        body: {
          username,
          user_id: userId,
          success,
          error_message: errorMessage
        }
      });
    } catch (err) {
      console.error('Failed to log login attempt:', err);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Use edge function to lookup email by username (bypasses RLS)
      const { data: lookupData, error: edgeFnError } = await supabase.functions.invoke('lookup-user-email', {
        body: { username }
      });

      if (edgeFnError || !lookupData?.email) {
        await logLoginAttempt(null, false, 'Utilizator negăsit');
        toast({
          title: 'Eroare la autentificare',
          description: 'Nume de utilizator sau parolă incorectă.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Now sign in with the email
      const { error } = await signIn(lookupData.email, password);

      if (error) {
        await logLoginAttempt(lookupData.user_id || null, false, error.message || 'Parolă incorectă');
      } else {
        // Get the user ID from the session for successful login
        const { data: sessionData } = await supabase.auth.getSession();
        await logLoginAttempt(sessionData?.session?.user?.id || null, true, null);
        navigate('/');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      await logLoginAttempt(null, false, 'Eroare internă');
      toast({
        title: 'Eroare',
        description: 'A apărut o eroare la autentificare.',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src={demoLogo}
              alt="Demo Cabinet Dentar"
              className="h-28 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Cabinet Dentar Demo</CardTitle>
          <CardDescription>
            Sistem de management pentru cabinetul stomatologic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-username">Nume utilizator</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="utilizator"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
              />
              {errors.username && (
                <p className="text-sm text-destructive">{errors.username}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Parolă</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              <LogIn className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Se autentifică...' : 'Autentificare'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
