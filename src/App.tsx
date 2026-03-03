import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Install from "./pages/Install";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";


const queryClient = new QueryClient();

function AppContent() {
  const { user, mustChangePassword, clearMustChangePassword } = useAuth();

  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {user && (
          <ChangePasswordDialog
            open={mustChangePassword}
            userId={user.id}
            onPasswordChanged={clearMustChangePassword}
          />
        )}

        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="/install" element={<Install />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

const App = () => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
