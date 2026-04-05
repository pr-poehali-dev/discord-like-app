import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface User {
  id: number;
  username: string;
  email: string;
  avatar_color: string;
  status: string;
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const [avatarColor, setAvatarColor] = useState<string>("#00ff88");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    const savedAvatar = localStorage.getItem("avatarImg");
    const savedColor = localStorage.getItem("avatarColor");
    if (stored && token) {
      try {
        const u = JSON.parse(stored) as User;
        setUser(u);
        setAvatarColor(savedColor || u.avatar_color);
      } catch {
        localStorage.clear();
      }
    }
    if (savedAvatar) setAvatarImg(savedAvatar);
    setChecked(true);
  }, []);

  const handleAuth = (u: User, token: string) => {
    setUser(u);
    setAvatarColor(u.avatar_color);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(u));
    localStorage.setItem("avatarColor", u.avatar_color);
  };

  const handleLogout = () => {
    setUser(null);
    setAvatarImg(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("avatarImg");
    localStorage.removeItem("avatarColor");
  };

  const handleAvatarChange = (img: string | null, color?: string) => {
    setAvatarImg(img);
    if (img) {
      localStorage.setItem("avatarImg", img);
    } else {
      localStorage.removeItem("avatarImg");
    }
    if (color) {
      setAvatarColor(color);
      localStorage.setItem("avatarColor", color);
    }
  };

  if (!checked) return null;
  if (!user) return <Auth onAuth={handleAuth} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Index
              user={{ ...user, avatar_color: avatarColor }}
              avatarImg={avatarImg}
              onLogout={handleLogout}
              onAvatarChange={handleAvatarChange}
            />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppContent />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
