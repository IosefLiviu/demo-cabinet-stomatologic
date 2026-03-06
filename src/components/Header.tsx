import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Users, LogIn, Menu, User, Download } from 'lucide-react';
import demoLogo from '@/assets/demo-logo.svg';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CasBudgetDisplay } from './CasBudgetDisplay';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    displayName,
    signOut
  } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4">
        <Link to="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={demoLogo}
            alt="Demo Cabinet Dentar"
            className="h-9 w-auto sm:h-11 sm:w-auto object-contain shrink-0"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                  <Users className="h-4 w-4 mr-2" />
                  Administrare
                </Button>
              )}
              <CasBudgetDisplay />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{displayName || user.email?.split('@')[0] || 'Utilizator'}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Deconectare
              </Button>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              Autentificare
            </Button>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          {user ? (
            <>
              <CasBudgetDisplay />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium border-b mb-1">
                    {displayName || user.email?.split('@')[0] || 'Utilizator'}
                  </div>
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Users className="h-4 w-4 mr-2" />
                      Administrare
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/install')}>
                    <Download className="h-4 w-4 mr-2" />
                    Instalează aplicația
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Deconectare
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
              <LogIn className="h-4 w-4 mr-2" />
              Autentificare
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}