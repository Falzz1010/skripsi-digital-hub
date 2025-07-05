import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen, FileText, MessageSquare, Calendar, Upload, CheckCircle, Clock, Users, GraduationCap, Bell } from "lucide-react";
import { LoginModal } from "@/components/LoginModal";
import { DashboardStudent } from "@/components/DashboardStudent";
import { DashboardLecturer } from "@/components/DashboardLecturer";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg shadow-lg">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SISKRIPSI</h1>
              <p className="text-sm text-muted-foreground">Sistem Informasi Skripsi</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-primary transition-colors" />
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {profile.full_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium text-foreground">{profile.full_name}</p>
              <p className="text-muted-foreground capitalize">{profile.role}</p>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {profile.role === 'student' ? (
        <DashboardStudent />
      ) : (
        <DashboardLecturer />
      )}
    </div>
  );
};

export default Index;
