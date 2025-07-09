import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Search, 
  MessageSquare, 
  FileText, 
  Calendar, 
  Eye,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const StudentsSection = ({ onNavigate }: { onNavigate: (section: string) => void }) => {
  const { profile } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStudents();
    
    // Real-time subscription for student updates
    const channel = supabase
      .channel('students-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'thesis'
      }, () => {
        fetchStudents();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchStudents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('thesis')
        .select(`
          *,
          student:profiles!thesis_student_id_fkey(id, full_name, nim_nidn, email),
          submissions:submissions(id, status, created_at, type)
        `)
        .or(`lecturer_id.is.null,lecturer_id.eq.${profile?.id}`);

      if (error) throw error;

      const studentsWithProgress = data?.map(thesis => {
        const submissions = thesis.submissions || [];
        const approvedSubmissions = submissions.filter((s: any) => s.status === 'approved');
        const totalSteps = 6; // Proposal, Bab 1-5, Final
        const progress = Math.round((approvedSubmissions.length / totalSteps) * 100);
        
        const lastActivity = submissions.length > 0 
          ? Math.max(...submissions.map((s: any) => new Date(s.created_at).getTime()))
          : 0;
        
        const daysSinceLastActivity = lastActivity 
          ? Math.floor((Date.now() - lastActivity) / (1000 * 60 * 60 * 24))
          : null;

        let status = 'active';
        if (daysSinceLastActivity !== null && daysSinceLastActivity > 7) {
          status = 'behind';
        } else if (submissions.some((s: any) => s.status === 'submitted')) {
          status = 'review';
        }

        const currentStage = getCurrentStage(submissions);

        return {
          ...thesis,
          progress,
          status,
          lastActivity: daysSinceLastActivity,
          currentStage,
          totalSubmissions: submissions.length,
          pendingReviews: submissions.filter((s: any) => s.status === 'submitted').length
        };
      }) || [];

      setStudents(studentsWithProgress);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStage = (submissions: any[]) => {
    const stages = ['Proposal', 'Bab 1', 'Bab 2', 'Bab 3', 'Bab 4', 'Bab 5', 'Final'];
    const approvedCount = submissions.filter(s => s.status === 'approved').length;
    
    if (approvedCount >= stages.length) return 'Completed';
    return stages[approvedCount] || 'Proposal';
  };

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

  const filteredStudents = students.filter(student =>
    student.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student?.nim_nidn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Mahasiswa Bimbingan</h2>
          <p className="text-muted-foreground">Kelola dan pantau progress mahasiswa</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {students.length} Mahasiswa
          </Badge>
          <Button variant="outline">
            Export Data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari mahasiswa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada mahasiswa</h3>
            <p className="text-muted-foreground">
              Belum ada mahasiswa yang dibimbing
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {student.student?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-lg">{student.student?.full_name}</h4>
                        <Badge className={getStatusColor(student.status)}>
                          {getStatusText(student.status)}
                        </Badge>
                        {student.status === 'behind' && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        {student.student?.nim_nidn}
                      </p>
                      
                      <p className="text-sm font-medium mb-3 text-foreground">
                        {student.title}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress:</span>
                          <span className="font-medium">{student.progress}%</span>
                        </div>
                        <Progress value={student.progress} className="h-2" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Stage saat ini:</span>
                          <p className="font-medium">{student.currentStage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Aktivitas terakhir:</span>
                          <p className="font-medium">
                            {student.lastActivity === null 
                              ? 'Belum ada aktivitas'
                              : student.lastActivity === 0 
                                ? 'Hari ini'
                                : `${student.lastActivity} hari lalu`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-blue-600">Submisi</p>
                        <p className="font-bold text-blue-800">{student.totalSubmissions}</p>
                      </div>
                      <div className="bg-orange-50 p-2 rounded">
                        <p className="text-xs text-orange-600">Review</p>
                        <p className="font-bold text-orange-800">{student.pendingReviews}</p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigate('chat')}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigate('reviews')}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onNavigate('schedule')}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};