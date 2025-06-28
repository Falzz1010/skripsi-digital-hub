
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, FileText, MessageSquare, Calendar, CheckCircle, Clock, AlertCircle, Star } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";

export const DashboardLecturer = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const students = [
    {
      name: "Ahmad Fauzi",
      nim: "20210123456",
      title: "Sistem Informasi Manajemen Inventori Berbasis Web",
      progress: 65,
      status: "active",
      lastActivity: "2 hari yang lalu",
      stage: "Bab 2"
    },
    {
      name: "Sari Dewi",
      nim: "20210123457", 
      title: "Aplikasi Mobile Learning dengan Gamifikasi",
      progress: 85,
      status: "review",
      lastActivity: "1 hari yang lalu",
      stage: "Bab 4"
    },
    {
      name: "Budi Santoso",
      nim: "20210123458",
      title: "Sistem Pakar Diagnosa Penyakit Tanaman",
      progress: 45,
      status: "behind",
      lastActivity: "1 minggu yang lalu",
      stage: "Bab 1"
    }
  ];

  const pendingReviews = [
    {
      student: "Ahmad Fauzi",
      file: "Bab_2_Tinjauan_Pustaka_v1.pdf",
      submitted: "1 hari yang lalu",
      type: "chapter"
    },
    {
      student: "Sari Dewi",
      file: "Draft_Skripsi_Lengkap.pdf",
      submitted: "3 hari yang lalu",
      type: "full-draft"
    }
  ];

  const upcomingMeetings = [
    {
      student: "Ahmad Fauzi",
      time: "Senin, 19 Feb 2024 • 10:00 WIB",
      topic: "Review Bab 2 - Tinjauan Pustaka",
      type: "scheduled"
    },
    {
      student: "Budi Santoso", 
      time: "Selasa, 20 Feb 2024 • 14:00 WIB",
      topic: "Diskusi Progress dan Target",
      type: "catch-up"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-green-100 text-green-800';
      case 'behind': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'On Track';
      case 'review': return 'Ready for Review';
      case 'behind': return 'Behind Schedule';
      default: return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Dosen</h2>
        <p className="text-gray-600">Selamat datang, Dr. Siti Nurhaliza, M.Kom</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Mahasiswa Bimbingan</TabsTrigger>
          <TabsTrigger value="reviews">Review File</TabsTrigger>
          <TabsTrigger value="schedule">Jadwal</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{students.length}</p>
                    <p className="text-sm text-gray-600">Total Bimbingan</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">{pendingReviews.length}</p>
                    <p className="text-sm text-gray-600">Pending Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{upcomingMeetings.length}</p>
                    <p className="text-sm text-gray-600">Jadwal Minggu Ini</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">4.8</p>
                    <p className="text-sm text-gray-600">Rating Bimbingan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>Update terbaru dari mahasiswa bimbingan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-700">AF</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Ahmad Fauzi mengupload Bab 2 - Tinjauan Pustaka</p>
                    <p className="text-sm text-gray-600">1 hari yang lalu</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">New Upload</Badge>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-700">SD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Sari Dewi mengirim pesan di chat</p>
                    <p className="text-sm text-gray-600">2 hari yang lalu</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Message</Badge>
                </div>

                <div className="flex items-center space-x-4 p-3 bg-orange-50 rounded-lg">
                  <Avatar>
                    <AvatarFallback className="bg-orange-100 text-orange-700">BS</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">Budi Santoso belum aktif selama 1 minggu</p>
                    <p className="text-sm text-gray-600">Perlu follow-up</p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Alert</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Mahasiswa Bimbingan</h3>
            <Button variant="outline">Export Data</Button>
          </div>

          <div className="grid gap-6">
            {students.map((student, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {student.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-lg">{student.name}</h4>
                        <p className="text-sm text-gray-600">{student.nim}</p>
                        <p className="text-sm font-medium mt-1">{student.title}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <Badge className={getStatusColor(student.status)}>
                        {getStatusText(student.status)}
                      </Badge>
                      <p className="text-sm text-gray-600">Progress: {student.progress}%</p>
                      <p className="text-xs text-gray-500">{student.lastActivity}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sedang mengerjakan: {student.stage}</span>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Lihat File
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">File Menunggu Review</h3>
            <Badge variant="secondary">{pendingReviews.length} file pending</Badge>
          </div>

          <div className="space-y-4">
            {pendingReviews.map((review, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-10 w-10 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">{review.file}</h4>
                        <p className="text-sm text-gray-600">Dari: {review.student}</p>
                        <p className="text-xs text-gray-500">Diupload {review.submitted}</p>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <Button variant="outline" size="sm">Preview</Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Jadwal Bimbingan</h3>
            <Button>Buat Jadwal Baru</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Jadwal Mendatang</CardTitle>
              <CardDescription>Jadwal bimbingan minggu ini</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingMeetings.map((meeting, index) => (
                  <div key={index} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-blue-900">{meeting.topic}</h4>
                        <p className="text-blue-700">dengan {meeting.student}</p>
                        <p className="text-sm text-blue-600 mt-1">{meeting.time}</p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">Reschedule</Button>
                        <Button size="sm" variant="destructive">Cancel</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
