import { Link, useNavigate } from 'react-router-dom';
import { Stethoscope, LogOut, Users, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
export function Header() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    signOut
  } = useAuth();
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  return <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Stethoscope className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">DentalCare</h1>
            <p className="text-xs text-muted-foreground">Soft Administrare Cabinet </p>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          {user ? <>
              {(isAdmin || user.email === 'andreiliviudiablo@gmail.com') && <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Administrare Doctori
                </Button>}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Deconectare
              </Button>
            </> : <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              Autentificare
            </Button>}
        </div>
      </div>
    </header>;
}