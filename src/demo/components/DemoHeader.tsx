import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Users, User, Download } from 'lucide-react';
import perfectSmileLogo from '@/assets/perfect-smile-logo.png';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DemoBanner } from './DemoBanner';
import { useDemoAuth } from '@/demo/contexts/DemoAuthContext';

export function DemoHeader() {
  const navigate = useNavigate();
  const { user, signOut } = useDemoAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <DemoBanner />
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        <Link to="/demo" className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={perfectSmileLogo}
            alt="Perfect Smile Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 object-contain shrink-0"
          />
          <div className="min-w-0 hidden xs:block">
            <h1 className="text-sm sm:text-lg font-bold text-foreground truncate">Perfect Smile Glim</h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">Sistem Management Cabinet Stomatologic</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/demo/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Administrare
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{user.display_name}</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/demo/auth'); }}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Deconectare</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
