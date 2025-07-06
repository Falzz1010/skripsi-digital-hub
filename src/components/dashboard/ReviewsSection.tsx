import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Eye,
  MessageSquare,
  Clock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ReviewsSection = () => {
  const { profile } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({
    status: '',
    comments: ''
  });

  useEffect(() => {
    fetchSubmissions();
    
    // Real-time subscription for submission updates
    const channel = supabase
      .channel('reviews-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'submissions'
      }, () => {
        fetchSubmissions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          thesis:thesis_id(title, lecturer_id),
          student:student_id(full_name, nim_nidn)
        `)
        .eq('thesis.lecturer_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Gagal memuat file review');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSubmission) return;

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: reviewData.status as "draft" | "submitted" | "under_review" | "approved" | "rejected" | "revision_needed",
          comments: reviewData.comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      toast.success('Review berhasil disimpan');
      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewData({ status: '', comments: '' });
      fetchSubmissions();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Gagal menyimpan review');
    }
  };

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

  const openReviewModal = (submission: any) => {
    setSelectedSubmission(submission);
    setReviewData({
      status: submission.status || 'under_review',
      comments: submission.comments || ''
    });
    setShowReviewModal(true);
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
      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
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

  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const reviewedSubmissions = submissions.filter(s => s.status !== 'submitted');

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
          <h2 className="text-2xl font-bold">Review File</h2>
          <p className="text-muted-foreground">Review dan berikan feedback pada submisi mahasiswa</p>
        </div>
        <Badge variant="secondary">
          {pendingSubmissions.length} file menunggu review
        </Badge>
      </div>

      {/* Pending Reviews */}
      {pendingSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <span>Menunggu Review ({pendingSubmissions.length})</span>
            </CardTitle>
            <CardDescription>File yang perlu direview segera</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSubmissions.map((submission) => (
                <div key={submission.id} className="p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-10 w-10 text-orange-600" />
                      <div>
                        <h4 className="font-semibold">{submission.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {submission.student?.full_name} - {submission.student?.nim_nidn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Diupload {new Date(submission.created_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {submission.file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(submission.file_url, submission.file_name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => openReviewModal(submission)}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Submisi</CardTitle>
          <CardDescription>Riwayat semua file yang telah disubmit</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Belum ada submisi</h3>
              <p className="text-muted-foreground">
                Belum ada file yang disubmit oleh mahasiswa
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div key={submission.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {getStatusIcon(submission.status)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold">{submission.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {submission.student?.full_name} - {submission.student?.nim_nidn}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {new Date(submission.created_at).toLocaleDateString('id-ID')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Versi {submission.version || 1}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(submission.status)}>
                        {getStatusText(submission.status)}
                      </Badge>
                      <div className="flex space-x-2">
                        {submission.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(submission.file_url, submission.file_name)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReviewModal(submission)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {submission.comments && (
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Komentar Review:</p>
                      <p className="text-sm text-muted-foreground">{submission.comments}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Submisi</DialogTitle>
            <DialogDescription>
              Berikan review dan feedback untuk: {selectedSubmission?.title}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReview} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Status Review</label>
              <Select 
                value={reviewData.status} 
                onValueChange={(value) => setReviewData({...reviewData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_review">Sedang Direview</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="revision_needed">Perlu Revisi</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Komentar & Feedback</label>
              <Textarea
                value={reviewData.comments}
                onChange={(e) => setReviewData({...reviewData, comments: e.target.value})}
                placeholder="Berikan feedback detail untuk mahasiswa..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowReviewModal(false)}
              >
                Batal
              </Button>
              <Button type="submit">Simpan Review</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};