import React, { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthForm } from "@/components/auth-form";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DonatePage from "@/pages/donate";
import { apiRequest } from "@/lib/queryClient";
import { ThemeProvider } from "@/components/theme-provider";

interface User {
  id: string;
  firstName: string;
  lastName: string;
}

function AuthenticatedApp({ user }: { user: User }) {
  return (
    <Switch>
      <Route path="/">
        {() => <Dashboard userId={user.id} />}
      </Route>
      <Route path="/dashboard">
        {() => <Dashboard userId={user.id} />}
      </Route>
      <Route path="/donate">
        {() => <DonatePage />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const result = await response.json();
        if (result.success) {
          setUser(result.data);
        }
      } catch (error) {
        // User not authenticated
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (userData: User) => {
    setUser(userData);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  return <AuthenticatedApp user={user} />;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Toaster />
        <AppContent />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
