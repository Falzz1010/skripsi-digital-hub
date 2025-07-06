import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  FileText, 
  Upload, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users,
  Star 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const OverviewSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalThesis: 0,
    pendingReviews: 0,
    upcomingMeetings: 0,
    progress: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
    
    // Real-time subscription for activities
    const channel = supabase
      .channel('overview-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thesis'
      }, () => {
        fetchOverviewData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchOverviewData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, () => {
        fetchOverviewData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchOverviewData = async () => {
    try {
      if (profile?.role === 'student') {
        await fetchStudentOverview();
      } else if (profile?.role === 'lecturer') {
        await fetchLecturerOverview();
      } else if (profile?.role === 'admin') {
        await fetchAdminOverview();
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Gagal memuat data overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentOverview = async () => {
    // Fetch thesis data
    const { data: thesis } = await supabase
      .from('thesis')
      .select('*')
      .eq('student_id', profile?.id)
      .single();

    // Fetch submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('student_id', profile?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch upcoming meetings
    const { data: meetings } = await supabase
      .from('guidance_schedule')
      .select('*')
      .eq('student_id', profile?.id)
      .gte('scheduled_date', new Date().toISOString())
      .order('scheduled_date', { ascending: true });

    setStats({
      totalThesis: thesis ? 1 : 0,
      pendingReviews: submissions?.filter(s => s.status === 'submitted').length || 0,
      upcomingMeetings: meetings?.length || 0,
      progress: calculateProgress(submissions || [])
    });

    setRecentActivities(submissions?.map(s => ({
      type: 'submission',
      title: `Upload ${s.title}`,
      time: s.created_at,
      status: s.status
    })) || []);
  };

  const fetchLecturerOverview = async () => {
    // Fetch students under supervision
    const { data: thesis } = await supabase
      .from('thesis')
      .select('*, student:profiles(full_name)')
      .eq('lecturer_id', profile?.id);

    // Fetch pending submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, thesis!inner(lecturer_id)')
      .eq('thesis.lecturer_id', profile?.id)
      .eq('status', 'submitted');

    // Fetch upcoming meetings
    const { data: meetings } = await supabase
      .from('guidance_schedule')
      .select('*')
      .eq('lecturer_id', profile?.id)
      .gte('scheduled_date', new Date().toISOString());

    setStats({
      totalThesis: thesis?.length || 0,
      pendingReviews: submissions?.length || 0,
      upcomingMeetings: meetings?.length || 0,
      progress: 0
    });

    setRecentActivities(submissions?.map(s => ({
      type: 'review',
      title: `Review ${s.title}`,
      time: s.created_at,
      status: 'pending'
    })) || []);
  };

  const fetchAdminOverview = async () => {
    // Fetch all thesis
    const { data: allThesis } = await supabase
      .from('thesis')
      .select('*');

    // Fetch all submissions
    const { data: allSubmissions } = await supabase
      .from('submissions')
      .select('*')
      .eq('status', 'submitted');

    // Fetch all meetings
    const { data: allMeetings } = await supabase
      .from('guidance_schedule')
      .select('*')
      .gte('scheduled_date', new Date().toISOString());

    setStats({
      totalThesis: allThesis?.length || 0,
      pendingReviews: allSubmissions?.length || 0,
      upcomingMeetings: allMeetings?.length || 0,
      progress: 0
    });

    setRecentActivities([]);
  };

  const calculateProgress = (submissions: any[]) => {
    const totalSteps = 6; // Proposal, Bab 1-5, Final
    const completedSteps = submissions.filter(s => s.status === 'approved').length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'revision_needed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Overview</h2>
        <p className="text-muted-foreground">
          Dashboard {profile?.role === 'student' ? 'Mahasiswa' : 
                  profile?.role === 'lecturer' ? 'Dosen' : 'Admin'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.totalThesis}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === 'student' ? 'Skripsi Aktif' : 'Total Bimbingan'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.upcomingMeetings}</p>
                <p className="text-sm text-muted-foreground">Jadwal Mendatang</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.progress}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('files')}
        >
          <CardContent className="p-6 text-center">
            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold mb-1">File Skripsi</h3>
            <p className="text-sm text-muted-foreground">Kelola file dan submisi</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('chat')}
        >
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Komunikasi</h3>
            <p className="text-sm text-muted-foreground">Chat real-time</p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate('schedule')}
        >
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Jadwal</h3>
            <p className="text-sm text-muted-foreground">Atur jadwal bimbingan</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      {recentActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Update terbaru dari sistem</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.slice(0, 3).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    {activity.type === 'submission' ? (
                      <Upload className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.time).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge className={getStatusColor(activity.status)}>
                    {activity.status === 'submitted' ? 'Menunggu Review' : 
                     activity.status === 'approved' ? 'Disetujui' : 'Perlu Revisi'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};