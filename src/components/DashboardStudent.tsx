
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, Upload, MessageSquare, Calendar, CheckCircle, Clock, AlertCircle, Download } from "lucide-react";
import { UploadModal } from "@/components/UploadModal";
import { ChatBox } from "@/components/ChatBox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const DashboardStudent = () => {
  const { user } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [studentThesisId, setStudentThesisId] = useState<string | null>(null);

  useEffect(() => {
    // Ambil thesisId mahasiswa dari Supabase
    if (user?.id) {
      (async () => {
        const { data: thesis, error } = await supabase
          .from('thesis')
          .select('id')
          .eq('student_id', user.id)
          .maybeSingle();
        if (!error && thesis?.id) {
          setStudentThesisId(thesis.id);
        }
      })();
    }
  }, [user?.id]);

  const thesisProgress = 65;
  
  const timeline = [
    { title: "Pengajuan Judul", status: "completed", date: "15 Jan 2024" },
    { title: "Persetujuan Judul", status: "completed", date: "20 Jan 2024" },
    { title: "Bab 1 - Pendahuluan", status: "completed", date: "1 Feb 2024" },
    { title: "Bab 2 - Tinjauan Pustaka", status: "current", date: "Target: 15 Feb 2024" },
    { title: "Bab 3 - Metodologi", status: "pending", date: "Target: 1 Mar 2024" },
    { title: "Seminar Proposal", status: "pending", date: "Target: 15 Mar 2024" },
  ];

  const recentFiles = [
    { name: "Bab_1_Pendahuluan_v2.pdf", date: "12 Feb 2024", status: "approved", size: "2.3 MB" },
    { name: "Proposal_Skripsi_Final.pdf", date: "5 Feb 2024", status: "revision", size: "1.8 MB" },
    { name: "Outline_Skripsi.docx", date: "28 Jan 2024", status: "approved", size: "156 KB" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'current': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'revision': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'revision': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Mahasiswa</h2>
        <p className="text-gray-600">Selamat datang kembali, Ahmad Fauzi (20210123456)</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">File Skripsi</TabsTrigger>
          <TabsTrigger value="chat">Komunikasi</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Progress Skripsi</span>
              </CardTitle>
              <CardDescription>
                Judul: "Sistem Informasi Manajemen Inventori Berbasis Web dengan Metode FIFO"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progress Keseluruhan</span>
                    <span className="text-sm text-gray-600">{thesisProgress}%</span>
                  </div>
                  <Progress value={thesisProgress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-100 text-green-700 text-xs">DP</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Dr. Siti Nurhaliza, M.Kom</p>
                      <p className="text-xs text-gray-600">Dosen Pembimbing</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor('current')}>
                      Bab 2 - Review
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowUploadModal(true)}>
              <CardContent className="p-6 text-center">
                <Upload className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Upload File</h3>
                <p className="text-sm text-gray-600">Upload skripsi atau revisi</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('chat')}>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Chat Dosen</h3>
                <p className="text-sm text-gray-600">Diskusi dengan pembimbing</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold mb-1">Jadwal Terbaru</h3>
                <p className="text-sm text-gray-600">Lihat jadwal bimbingan</p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline Progress</CardTitle>
              <CardDescription>Tracking progres pengerjaan skripsi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">{item.title}</h4>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status === 'completed' ? 'Selesai' : 
                           item.status === 'current' ? 'Sedang Dikerjakan' : 'Belum Mulai'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">File Skripsi</h3>
            <Button onClick={() => setShowUploadModal(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>File Terbaru</CardTitle>
              <CardDescription>Daftar file yang telah diupload</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-medium">{file.name}</h4>
                        <p className="text-sm text-gray-600">{file.date} • {file.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(file.status)}>
                        {file.status === 'approved' ? 'Disetujui' : 'Perlu Revisi'}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <ChatBox userRole="student" />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jadwal Bimbingan</CardTitle>
              <CardDescription>Jadwal konsultasi dengan dosen pembimbing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-blue-900">Bimbingan Bab 2</h4>
                      <p className="text-blue-700">Senin, 19 Februari 2024 • 10:00 - 11:00 WIB</p>
                      <p className="text-sm text-blue-600 mt-1">Ruang Dosen Lt.3 atau Google Meet</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-green-900">Review Bab 1</h4>
                      <p className="text-green-700">Jumat, 9 Februari 2024 • 14:00 - 15:00 WIB</p>
                      <p className="text-sm text-green-600 mt-1">✓ Selesai - Disetujui dengan catatan minor</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Completed</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        thesisId={studentThesisId ?? undefined}
      />
    </div>
  );
};
