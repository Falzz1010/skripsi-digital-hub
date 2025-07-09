import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, 
  Upload, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Users,
  Star,
  TrendingUp,
  Bot,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export const OverviewSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalThesis: 0,
    pendingReviews: 0,
    upcomingMeetings: 0,
    progress: 0
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [progressData, setProgressData] = useState<any[]>([]);
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
    generateAIInsight();
    
    // Real-time subscription for activities
    const channel = supabase
      .channel('overview-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thesis'
      }, () => {
        fetchOverviewData();
        generateAIInsight();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchOverviewData();
        generateAIInsight();
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

    // Generate chart data for student progress over time
    generateChartData(submissions || []);
  };

  const fetchLecturerOverview = async () => {
    // Fetch students under supervision (termasuk yang belum ada lecturer_id)
    const { data: thesis } = await supabase
      .from('thesis')
      .select('*, student:profiles(full_name)')
      .or(`lecturer_id.is.null,lecturer_id.eq.${profile?.id}`);

    // Fetch pending submissions (termasuk yang belum ada lecturer_id)
    const { data: submissions } = await supabase
      .from('submissions')
      .select('*, thesis!inner(lecturer_id)')
      .or(`thesis.lecturer_id.is.null,thesis.lecturer_id.eq.${profile?.id}`)
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

    // Generate lecturer dashboard charts
    generateLecturerCharts(thesis || [], submissions || []);
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

    // Generate admin charts
    generateAdminCharts(allThesis || [], allSubmissions || []);
  };

  const calculateProgress = (submissions: any[]) => {
    const totalSteps = 6; // Proposal, Bab 1-5, Final
    const completedSteps = submissions.filter(s => s.status === 'approved').length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const generateChartData = (submissions: any[]) => {
    // Progress over time chart for students
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const progressByDate = last7Days.map(date => {
      const daySubmissions = submissions.filter(s => 
        s.created_at.split('T')[0] === date
      );
      return {
        date: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        submissions: daySubmissions.length,
        approved: daySubmissions.filter(s => s.status === 'approved').length
      };
    });

    setChartData(progressByDate);

    // Status distribution pie chart
    const statusCounts = submissions.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status === 'approved' ? 'Disetujui' : 
            status === 'submitted' ? 'Menunggu' : 
            status === 'revision_needed' ? 'Revisi' : 'Lainnya',
      value: count,
      color: status === 'approved' ? '#10B981' : 
             status === 'submitted' ? '#3B82F6' : 
             status === 'revision_needed' ? '#F59E0B' : '#6B7280'
    }));

    setPieData(pieChartData);
  };

  const generateLecturerCharts = (thesis: any[], submissions: any[]) => {
    // Student progress comparison
    const studentProgress = thesis.map(t => {
      const studentSubmissions = submissions.filter(s => s.thesis_id === t.id);
      const approvedCount = studentSubmissions.filter(s => s.status === 'approved').length;
      return {
        name: t.student?.full_name?.split(' ')[0] || 'Unknown',
        progress: Math.round((approvedCount / 6) * 100),
        submissions: studentSubmissions.length
      };
    });

    setProgressData(studentProgress);

    // Monthly submission trends
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthKey = date.toISOString().slice(0, 7);
      
      const monthSubmissions = submissions.filter(s => 
        s.created_at.startsWith(monthKey)
      );
      
      return {
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        submissions: monthSubmissions.length,
        approved: monthSubmissions.filter(s => s.status === 'approved').length
      };
    });

    setChartData(monthlyData);
  };

  const generateAdminCharts = (thesis: any[], submissions: any[]) => {
    // System-wide statistics
    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      const monthKey = date.toISOString().slice(0, 7);
      
      return {
        month: date.toLocaleDateString('id-ID', { month: 'short' }),
        thesis: thesis.filter(t => t.created_at?.startsWith(monthKey)).length,
        submissions: submissions.filter(s => s.created_at?.startsWith(monthKey)).length
      };
    });

    setChartData(monthlyStats);
  };

  const generateAIInsight = async () => {
    try {
      setAiLoading(true);
      const context = {
        role: profile?.role,
        stats: stats,
        recentActivities: recentActivities.slice(0, 5)
      };

      const { data } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: 'Berikan analisis singkat dan rekomendasi berdasarkan data dashboard saat ini',
          context: context,
          type: profile?.role === 'student' ? 'thesis_analysis' : 
                profile?.role === 'lecturer' ? 'student_performance' : 'system_analysis'
        }
      });

      if (data?.response) {
        setAiInsight(data.response);
      }
    } catch (error) {
      console.error('Error generating AI insight:', error);
      setAiInsight('AI insight tidak tersedia saat ini.');
    } finally {
      setAiLoading(false);
    }
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

      {/* AI Insights Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-purple-500" />
            <span>AI Insight & Rekomendasi</span>
          </CardTitle>
          <CardDescription>Analisis cerdas dan saran dari AI</CardDescription>
        </CardHeader>
        <CardContent>
          {aiLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              <span className="text-sm text-muted-foreground">AI sedang menganalisis...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{aiInsight}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={generateAIInsight}
                disabled={aiLoading}
              >
                <Bot className="h-4 w-4 mr-2" />
                Refresh Insight
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                <span>
                  {profile?.role === 'student' ? 'Progress Mingguan' :
                   profile?.role === 'lecturer' ? 'Tren Bulanan' : 'Statistik Sistem'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={profile?.role === 'student' ? 'date' : 'month'} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey={profile?.role === 'admin' ? 'thesis' : 'submissions'} 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name={profile?.role === 'admin' ? 'Skripsi' : 'Submisi'}
                  />
                  {profile?.role !== 'admin' && (
                    <Line 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="Disetujui"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {pieData.length > 0 && profile?.role === 'student' && (
          <Card>
            <CardHeader>
              <CardTitle>Status Distribusi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {progressData.length > 0 && profile?.role === 'lecturer' && (
          <Card>
            <CardHeader>
              <CardTitle>Progress Mahasiswa</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="progress" fill="#3B82F6" name="Progress %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
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