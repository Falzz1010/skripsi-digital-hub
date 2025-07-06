import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Bell, Menu } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { OverviewSection } from "@/components/dashboard/OverviewSection";
import { FilesSection } from "@/components/dashboard/FilesSection";
import { ChatSection } from "@/components/dashboard/ChatSection";
import { ScheduleSection } from "@/components/dashboard/ScheduleSection";
import { StudentsSection } from "@/components/dashboard/StudentsSection";
import { ReviewsSection } from "@/components/dashboard/ReviewsSection";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";

const Index = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-secondary/10">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Memuat sistem...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  // Show message if profile is still loading or doesn't exist
  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-2xl shadow-lg">
                <GraduationCap className="h-12 w-12 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
              SISKRIPSI
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Sedang menyiapkan profil Anda...
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                size="lg" 
                onClick={refreshProfile}
                disabled={loading}
              >
                {loading ? "Memuat..." : "Muat Ulang Profil"}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderMainContent = () => {
    if (profile.role === 'admin') {
      return <AdminDashboard activeSection={activeSection} />;
    }

    switch (activeSection) {
      case 'overview':
        return <OverviewSection onNavigate={setActiveSection} />;
      case 'files':
        return <FilesSection />;
      case 'chat':
        return <ChatSection />;
      case 'schedule':
        return <ScheduleSection />;
      case 'students':
        return <StudentsSection onNavigate={setActiveSection} />;
      case 'reviews':
        return <ReviewsSection />;
      default:
        return <OverviewSection onNavigate={setActiveSection} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/30 to-secondary/10">
        <AppSidebar onNavigate={setActiveSection} activeSection={activeSection} />
        
        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="bg-card border-b border-border shadow-sm sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-3">
                <SidebarTrigger />
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-primary to-secondary p-1.5 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">SISKRIPSI</h1>
                    <p className="text-xs text-muted-foreground">Sistem Informasi Skripsi</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm hidden sm:block">
                  <p className="font-medium text-foreground">{profile.full_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{profile.role}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {renderMainContent()}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
