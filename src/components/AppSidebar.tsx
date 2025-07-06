import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  Home, 
  FileText, 
  MessageSquare, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  GraduationCap 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AppSidebarProps {
  onNavigate: (section: string) => void;
  activeSection: string;
}

export function AppSidebar({ onNavigate, activeSection }: AppSidebarProps) {
  const { profile, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const studentItems = [
    { title: "Overview", icon: Home, key: "overview" },
    { title: "File Skripsi", icon: FileText, key: "files" },
    { title: "Komunikasi", icon: MessageSquare, key: "chat" },
    { title: "Jadwal", icon: Calendar, key: "schedule" },
  ];

  const lecturerItems = [
    { title: "Overview", icon: Home, key: "overview" },
    { title: "Mahasiswa", icon: Users, key: "students" },
    { title: "Review File", icon: FileText, key: "reviews" },
    { title: "Komunikasi", icon: MessageSquare, key: "chat" },
    { title: "Jadwal", icon: Calendar, key: "schedule" },
  ];

  const adminItems = [
    { title: "Overview", icon: Home, key: "overview" },
    { title: "Dosen", icon: Users, key: "lecturers" },
    { title: "Mahasiswa", icon: GraduationCap, key: "students" },
    { title: "Skripsi", icon: FileText, key: "thesis" },
    { title: "Laporan", icon: Calendar, key: "reports" },
    { title: "Pengaturan", icon: Settings, key: "settings" },
  ];

  const getMenuItems = () => {
    switch (profile?.role) {
      case 'lecturer':
        return lecturerItems;
      case 'admin':
        return adminItems;
      default:
        return studentItems;
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-primary to-secondary p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold">SISKRIPSI</h1>
              <p className="text-xs text-muted-foreground">Sistem Informasi Skripsi</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {getMenuItems().map((item) => (
                <SidebarMenuItem key={item.key}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.key)}
                    isActive={activeSection === item.key}
                    className="w-full justify-start"
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}