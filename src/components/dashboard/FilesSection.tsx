import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Upload, 
  Download, 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Bot,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadModal } from "@/components/UploadModal";

export const FilesSection = () => {
  const { profile } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [studentThesisId, setStudentThesisId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    
    // Real-time subscription for file updates
    const channel = supabase
      .channel('files-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchFiles();
      })
      .subscribe();

    // For students we need the thesis id once so that we can upload new submissions
    if (profile?.role === 'student') {
      (async () => {
        const { data: thesis, error } = await supabase
          .from('thesis')
          .select('id')
          .eq('student_id', profile.id)
          .maybeSingle();

        if (!error && thesis?.id) {
          setStudentThesisId(thesis.id);
        }
      })();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchFiles = async () => {
    try {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          thesis:thesis_id(title, student:profiles(full_name))
        `)
        .order('created_at', { ascending: false });

      if (profile?.role === 'student') {
        query = query.eq('student_id', profile.id);
      } else if (profile?.role === 'lecturer') {
        query = query.eq('thesis.lecturer_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Gagal memuat file');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800'; 
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'revision_needed': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'submitted': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'under_review': return <Eye className="h-4 w-4 text-yellow-600" />;
      case 'revision_needed': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Disetujui';
      case 'submitted': return 'Menunggu Review';
      case 'under_review': return 'Sedang Direview';
      case 'revision_needed': return 'Perlu Revisi';
      case 'rejected': return 'Ditolak';
      default: return 'Draft';
    }
  };

  const generateAIAnalysis = async (file: any) => {
    try {
      setAiLoading(true);
      setSelectedFile(file);
      
      const { data } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Analisis file berikut dan berikan rekomendasi untuk perbaikan: ${file.title}. Status saat ini: ${file.status}. ${file.comments ? 'Komentar sebelumnya: ' + file.comments : ''}`,
          context: {
            fileName: file.title,
            status: file.status,
            comments: file.comments,
            fileType: file.type,
            version: file.version
          },
          type: 'file_review'
        }
      });

      if (data?.response) {
        setAiAnalysis(data.response);
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      toast.error('Gagal menganalisis file dengan AI');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.file_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      const { data } = await supabase.storage.from('thesis-files').download(fileUrl);
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Gagal mengunduh file');
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">File Skripsi</h2>
          <p className="text-muted-foreground">Kelola file dan submisi skripsi</p>
        </div>
        {profile?.role === 'student' && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Menunggu Review</SelectItem>
            <SelectItem value="under_review">Sedang Direview</SelectItem>
            <SelectItem value="approved">Disetujui</SelectItem>
            <SelectItem value="revision_needed">Perlu Revisi</SelectItem>
            <SelectItem value="rejected">Ditolak</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Files List */}
      <div className="space-y-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada file</h3>
              <p className="text-muted-foreground mb-4">
                {profile?.role === 'student' 
                  ? 'Upload file skripsi pertama Anda'
                  : 'Belum ada file dari mahasiswa'
                }
              </p>
              {profile?.role === 'student' && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file) => (
            <Card key={file.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="h-10 w-10 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-lg truncate">{file.title}</h4>
                      {file.file_name && (
                        <p className="text-sm text-muted-foreground truncate">{file.file_name}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(file.created_at).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Versi {file.version || 1}
                        </p>
                        {profile?.role === 'lecturer' && file.thesis?.student && (
                          <p className="text-sm text-muted-foreground">
                            {file.thesis.student.full_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(file.status)}
                      <Badge className={getStatusColor(file.status)}>
                        {getStatusText(file.status)}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      {file.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.file_url, file.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => generateAIAnalysis(file)}
                      >
                        <Bot className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                {file.comments && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Komentar:</p>
                    <p className="text-sm text-muted-foreground">{file.comments}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* AI Analysis Modal */}
      {selectedFile && aiAnalysis && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <span>AI Analysis: {selectedFile.title}</span>
            </CardTitle>
            <CardDescription>Analisis dan rekomendasi dari AI</CardDescription>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                <span className="text-sm text-muted-foreground">AI sedang menganalisis file...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{aiAnalysis}</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedFile(null)}
                >
                  Tutup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <UploadModal 
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        thesisId={studentThesisId ?? undefined}
      />
    </div>
  );
};