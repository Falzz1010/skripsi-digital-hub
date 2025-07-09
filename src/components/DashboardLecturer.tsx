
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, FileText, MessageSquare, Calendar, CheckCircle, Clock, AlertCircle, Star } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const DashboardLecturer = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    pendingReviews: 0,
    upcomingMeetings: 0,
    rating: 4.8
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
    
    // Real-time subscription
    const channel = supabase
      .channel('lecturer-dashboard')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thesis'
      }, () => {
        fetchDashboardData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'guidance_schedule'
      }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch students under supervision
      const { data: students } = await supabase
        .from('thesis')
        .select(`
          *,
          student:profiles!thesis_student_id_fkey(full_name, nim_nidn)
        `)
        .or(`lecturer_id.is.null,lecturer_id.eq.${profile?.id}`);

      // Fetch pending submissions
      const { data: submissions } = await supabase
        .from('submissions')
        .select(`
          *,
          thesis:thesis_id(title, lecturer_id),
          student:student_id(full_name)
        `)
        .or(`thesis.lecturer_id.is.null,thesis.lecturer_id.eq.${profile?.id}`)
        .eq('status', 'submitted');

      // Fetch upcoming meetings
      const { data: meetings } = await supabase
        .from('guidance_schedule')
        .select(`
          *,
          student:profiles!guidance_schedule_student_id_fkey(full_name)
        `)
        .eq('lecturer_id', profile?.id)
        .gte('scheduled_date', new Date().toISOString())
        .order('scheduled_date', { ascending: true });

      // Calculate stats
      setStats({
        totalStudents: students?.length || 0,
        pendingReviews: submissions?.length || 0,
        upcomingMeetings: meetings?.length || 0,
        rating: 4.8
      });

      // Generate recent activities
      const activities = [];
      
      // Add recent submissions
      if (submissions) {
        submissions.slice(0, 3).forEach(submission => {
          activities.push({
            type: 'upload',
            student: submission.student?.full_name,
            title: submission.title,
            time: submission.created_at,
            status: 'New Upload'
          });
        });
      }

      // Add recent meetings
      if (meetings) {
        meetings.slice(0, 2).forEach(meeting => {
          activities.push({
            type: 'meeting',
            student: meeting.student?.full_name,
            title: meeting.title,
            time: meeting.scheduled_date,
            status: 'Scheduled'
          });
        });
      }

      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New Upload': return 'bg-blue-100 text-blue-800';
      case 'Scheduled': return 'bg-green-100 text-green-800';
      case 'Alert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
    return `${Math.floor(diffInDays / 7)} minggu yang lalu`;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Dosen</h2>
        <p className="text-gray-600">Selamat datang, {profile?.full_name}</p>
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
                    <p className="text-2xl font-bold">{stats.totalStudents}</p>
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
                    <p className="text-2xl font-bold">{stats.pendingReviews}</p>
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
                    <p className="text-2xl font-bold">{stats.upcomingMeetings}</p>
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
                    <p className="text-2xl font-bold">{stats.rating}</p>
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
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Belum ada aktivitas terbaru</p>
                  </div>
                ) : (
                  recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {activity.student?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.student} {activity.type === 'upload' ? 'mengupload' : 'mengirim'} {activity.title}
                        </p>
                        <p className="text-sm text-gray-600">{formatTimeAgo(activity.time)}</p>
                      </div>
                      <Badge className={getStatusColor(activity.status)}>
                        {activity.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Gunakan tab "Mahasiswa Bimbingan" untuk melihat data lengkap</p>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Gunakan tab "Review File" untuk melihat data lengkap</p>
          </div>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">Gunakan tab "Jadwal" untuk melihat data lengkap</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
