
import { useState } from "react";
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

const Index = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'lecturer' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLogin = (role: 'student' | 'lecturer') => {
    setIsLoggedIn(true);
    setUserRole(role);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
  };

  if (isLoggedIn && userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SISKRIPSI</h1>
                <p className="text-sm text-gray-600">Sistem Informasi Skripsi</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-gray-600 cursor-pointer hover:text-blue-600 transition-colors" />
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {userRole === 'student' ? 'M' : 'D'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        {userRole === 'student' ? (
          <DashboardStudent />
        ) : (
          <DashboardLecturer />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            SISKRIPSI
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Sistem Informasi Manajemen Skripsi untuk memudahkan komunikasi dan monitoring antara mahasiswa dan dosen pembimbing
          </p>
          <div className="flex justify-center space-x-4">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowLoginModal(true)}
            >
              <Users className="mr-2 h-5 w-5" />
              Masuk Sebagai Mahasiswa
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => setShowLoginModal(true)}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Masuk Sebagai Dosen
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-blue-100 p-3 rounded-lg w-fit">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-lg">Upload & Manajemen Skripsi</CardTitle>
              <CardDescription>
                Upload file skripsi, proposal, dan revisi dengan mudah. Kelola versi dokumen dengan sistem histori yang lengkap.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-green-100 p-3 rounded-lg w-fit">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Komunikasi Real-time</CardTitle>
              <CardDescription>
                Chat langsung dengan dosen pembimbing, berikan feedback, dan diskusi mengenai progress skripsi secara real-time.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-purple-100 p-3 rounded-lg w-fit">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Progress Tracking</CardTitle>
              <CardDescription>
                Monitor progress skripsi dari pengajuan judul hingga sidang dengan timeline yang jelas dan terstruktur.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-orange-100 p-3 rounded-lg w-fit">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle className="text-lg">Template & Panduan</CardTitle>
              <CardDescription>
                Akses template skripsi, panduan penulisan, dan format dokumen resmi kampus yang telah distandarisasi.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-red-100 p-3 rounded-lg w-fit">
                <CheckCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-lg">Approval System</CardTitle>
              <CardDescription>
                Sistem persetujuan digital untuk pengajuan judul, seminar proposal, dan persiapan sidang skripsi.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <div className="bg-teal-100 p-3 rounded-lg w-fit">
                <Clock className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle className="text-lg">Jadwal Bimbingan</CardTitle>
              <CardDescription>
                Atur dan kelola jadwal bimbingan, reminder otomatis, dan tracking kehadiran bimbingan.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Keunggulan SISKRIPSI</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
              <div className="text-gray-600">Digital & Paperless</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Akses Kapan Saja</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">Real-time</div>
              <div className="text-gray-600">Notifikasi & Update</div>
            </div>
          </div>
        </div>
      </div>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default Index;
