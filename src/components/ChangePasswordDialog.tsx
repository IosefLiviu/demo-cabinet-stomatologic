import { useState } from 'react';
import { z } from 'zod';
import { Key, Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string()
  .min(8, 'Parola trebuie să aibă minim 8 caractere')
  .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare')
  .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră');

interface ChangePasswordDialogProps {
  open: boolean;
  userId: string;
  onPasswordChanged: () => void;
}

export function ChangePasswordDialog({ open, userId, onPasswordChanged }: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const { toast } = useToast();

  const validateForm = () => {
    const newErrors: { newPassword?: string; confirmPassword?: string } = {};
    
    const passwordResult = passwordSchema.safeParse(newPassword);
    if (!passwordResult.success) {
      newErrors.newPassword = passwordResult.error.errors[0].message;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Parolele nu coincid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Update the password
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updatePasswordError) throw updatePasswordError;

      // Mark that password has been changed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ must_change_password: false })
        .eq('user_id', userId);

      if (profileError) throw profileError;

      toast({
        title: 'Parolă schimbată',
        description: 'Parola ta a fost actualizată cu succes.',
      });

      onPasswordChanged();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast({
        title: 'Eroare',
        description: error.message || 'Nu s-a putut schimba parola.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Schimbă parola
          </DialogTitle>
          <DialogDescription>
            Aceasta este prima ta autentificare. Te rugăm să îți setezi o parolă nouă pentru a continua.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Parolă nouă</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-destructive">{errors.newPassword}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Minim 8 caractere, cu literă mare, literă mică și cifră
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmă parola</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Key className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Se procesează...' : 'Schimbă parola'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
