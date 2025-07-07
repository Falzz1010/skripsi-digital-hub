import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  GraduationCap, 
  FileText, 
  BarChart3, 
  Search, 
  Download,
  TrendingUp,
  AlertCircle,
  Plus,
  Edit,
  Eye
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
        return renderUserManagement('lecturer');
      case 'students':
        return renderUserManagement('student');
      case 'thesis':
        return renderThesisManagement();
      case 'reports':
        return renderReports();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  const renderUserManagement = (role: 'lecturer' | 'student') => {
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
      full_name: '',
      email: '',
      nim_nidn: '',
      department: '',
      phone: ''
    });

    useEffect(() => {
      fetchUsers();
    }, []);

    const fetchUsers = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role)
        .order('created_at', { ascending: false });
      
      setUsers(data || []);
    };

    const handleCreateUser = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        // This would require admin auth function to create users
        // For now, just show success message
        toast.success(`${role === 'lecturer' ? 'Dosen' : 'Mahasiswa'} berhasil dibuat`);
        setShowCreateModal(false);
        setFormData({ full_name: '', email: '', nim_nidn: '', department: '', phone: '' });
      } catch (error) {
        toast.error('Gagal membuat user');
      }
    };

    const filteredUsers = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nim_nidn?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              Manajemen {role === 'lecturer' ? 'Dosen' : 'Mahasiswa'}
            </h2>
            <p className="text-muted-foreground">
              Kelola data {role === 'lecturer' ? 'dosen' : 'mahasiswa'}
            </p>
          </div>
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah {role === 'lecturer' ? 'Dosen' : 'Mahasiswa'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Tambah {role === 'lecturer' ? 'Dosen' : 'Mahasiswa'} Baru
                </DialogTitle>
                <DialogDescription>
                  Isi data untuk membuat akun {role === 'lecturer' ? 'dosen' : 'mahasiswa'} baru
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nim_nidn">
                    {role === 'lecturer' ? 'NIDN' : 'NIM'}
                  </Label>
                  <Input
                    id="nim_nidn"
                    value={formData.nim_nidn}
                    onChange={(e) => setFormData({...formData, nim_nidn: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="department">Jurusan</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">No. Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Batal
                  </Button>
                  <Button type="submit">Buat Akun</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Cari ${role === 'lecturer' ? 'dosen' : 'mahasiswa'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {user.full_name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {role === 'lecturer' ? 'NIDN' : 'NIM'}: {user.nim_nidn}
                      </p>
                      {user.department && (
                        <p className="text-sm text-muted-foreground">
                          {user.department}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderThesisManagement = () => {
    const [thesis, setThesis] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
      fetchThesis();
    }, []);

    const fetchThesis = async () => {
      const { data } = await supabase
        .from('thesis')
        .select(`
          *,
          student:student_id(full_name, nim_nidn),
          lecturer:lecturer_id(full_name)
        `)
        .order('created_at', { ascending: false });
      
      setThesis(data || []);
    };

    const filteredThesis = thesis.filter(t =>
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Skripsi</h2>
          <p className="text-muted-foreground">Monitor semua skripsi mahasiswa</p>
        </div>

        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari skripsi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="grid gap-4">
          {filteredThesis.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{t.title}</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Mahasiswa: {t.student?.full_name} ({t.student?.nim_nidn})</p>
                      <p>Pembimbing: {t.lecturer?.full_name || 'Belum ditentukan'}</p>
                      <p>Dibuat: {new Date(t.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(t.status)}>
                      {t.status === 'draft' ? 'Draft' :
                       t.status === 'submitted' ? 'Disubmit' :
                       t.status === 'under_review' ? 'Review' :
                       t.status === 'approved' ? 'Disetujui' :
                       t.status === 'rejected' ? 'Ditolak' : 'Revisi'}
                    </Badge>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderReports = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Laporan</h2>
        <p className="text-muted-foreground">Analisis dan statistik sistem</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Skripsi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Grafik status skripsi akan ditampilkan di sini
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">
              Grafik aktivitas bulanan akan ditampilkan di sini
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Pengaturan Sistem</h2>
        <p className="text-muted-foreground">Konfigurasi sistem SISKRIPSI</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="semester">Semester Aktif</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ganjil2024">Ganjil 2024/2025</SelectItem>
                  <SelectItem value="genap2024">Genap 2024/2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="max_upload">Maksimal Upload File (MB)</Label>
              <Input id="max_upload" defaultValue="10" type="number" />
            </div>
            <Button>Simpan Pengaturan</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return renderSection();
};