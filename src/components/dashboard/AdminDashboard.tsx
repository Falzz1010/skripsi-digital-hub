import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  GraduationCap, 
  FileText, 
  BarChart3, 
  Search, 
  Download,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminDashboard = ({ activeSection }: { activeSection: string }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalLecturers: 0,
    totalStudents: 0,
    totalThesis: 0,
    completedThesis: 0,
    pendingReviews: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
    
    // Real-time subscription for admin updates
    const channel = supabase
      .channel('admin-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, () => {
        fetchAdminData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thesis'
      }, () => {
        fetchAdminData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchAdminData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch user counts
      const { data: lecturers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'lecturer');

      const { data: students } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'student');

      // Fetch thesis data
      const { data: allThesis } = await supabase
        .from('thesis')
        .select('*');

      const { data: completedThesis } = await supabase
        .from('thesis')
        .select('id')
        .eq('status', 'approved');

      // Fetch pending submissions
      const { data: pendingSubmissions } = await supabase
        .from('submissions')
        .select('id')
        .eq('status', 'submitted');

      // Fetch recent activities
      const { data: recentSubmissions } = await supabase
        .from('submissions')
        .select(`
          *,
          student:student_id(full_name),
          thesis:thesis_id(title)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalLecturers: lecturers?.length || 0,
        totalStudents: students?.length || 0,
        totalThesis: allThesis?.length || 0,
        completedThesis: completedThesis?.length || 0,
        pendingReviews: pendingSubmissions?.length || 0
      });

      setRecentActivities(recentSubmissions?.map(s => ({
        type: 'submission',
        title: `${s.student?.full_name} mengupload ${s.title}`,
        time: s.created_at,
        status: s.status
      })) || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Gagal memuat data admin');
    } finally {
      setLoading(false);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard Admin</h2>
        <p className="text-muted-foreground">Kelola sistem dan pantau aktivitas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalLecturers}</p>
                <p className="text-sm text-muted-foreground">Dosen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-muted-foreground">Mahasiswa</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalThesis}</p>
                <p className="text-sm text-muted-foreground">Total Skripsi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completedThesis}</p>
                <p className="text-sm text-muted-foreground">Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pendingReviews}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Aktivitas Terbaru</CardTitle>
          <CardDescription>Update terbaru dari sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Belum ada aktivitas terbaru
              </p>
            ) : (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-muted/50 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.time).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {activity.status === 'submitted' ? 'Baru' : 'Update'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'lecturers':
        return <div>Manajemen Dosen - Coming Soon</div>;
      case 'students':
        return <div>Manajemen Mahasiswa - Coming Soon</div>;
      case 'thesis':
        return <div>Manajemen Skripsi - Coming Soon</div>;
      case 'reports':
        return <div>Laporan - Coming Soon</div>;
      case 'settings':
        return <div>Pengaturan Sistem - Coming Soon</div>;
      default:
        return renderOverview();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return renderSection();
};