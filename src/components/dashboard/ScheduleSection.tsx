import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  Plus, 
  MapPin, 
  User,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ScheduleSection = () => {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    student_id: '',
    scheduled_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchSchedules();
    if (profile?.role === 'lecturer') {
      fetchStudents();
    }
    
    // Real-time subscription for schedule updates
    const channel = supabase
      .channel('schedule-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'guidance_schedule'
      }, () => {
        fetchSchedules();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  const fetchSchedules = async () => {
    try {
      let query = supabase
        .from('guidance_schedule')
        .select(`
          *,
          student:profiles!guidance_schedule_student_id_fkey(full_name, nim_nidn),
          lecturer:profiles!guidance_schedule_lecturer_id_fkey(full_name),
          thesis:thesis_id(title)
        `)
        .order('scheduled_date', { ascending: true });

      if (profile?.role === 'student') {
        query = query.eq('student_id', profile.id);
      } else if (profile?.role === 'lecturer') {
        query = query.eq('lecturer_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('thesis')
        .select(`
          student_id,
          student:profiles!thesis_student_id_fkey(id, full_name, nim_nidn)
        `)
        .eq('lecturer_id', profile?.id);

      setStudents(data?.map(t => t.student) || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get thesis_id for the selected student
      const { data: thesis } = await supabase
        .from('thesis')
        .select('id')
        .eq('student_id', formData.student_id)
        .eq('lecturer_id', profile?.id)
        .single();

      if (!thesis) {
        toast.error('Thesis tidak ditemukan');
        return;
      }

      const { error } = await supabase
        .from('guidance_schedule')
        .insert({
          title: formData.title,
          student_id: formData.student_id,
          lecturer_id: profile?.id,
          thesis_id: thesis.id,
          scheduled_date: formData.scheduled_date,
          notes: formData.notes,
          status: 'scheduled'
        });

      if (error) throw error;

      toast.success('Jadwal berhasil dibuat');
      setShowCreateModal(false);
      setFormData({ title: '', student_id: '', scheduled_date: '', notes: '' });
      fetchSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Gagal membuat jadwal');
    }
  };

  const handleUpdateStatus = async (scheduleId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('guidance_schedule')
        .update({ status })
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success('Status jadwal berhasil diperbarui');
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Gagal memperbarui status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'scheduled': return 'Terjadwal';
      case 'cancelled': return 'Dibatalkan';
      case 'rescheduled': return 'Dijadwal Ulang';
      default: return 'Unknown';
    }
  };

  const isUpcoming = (date: string) => {
    return new Date(date) > new Date();
  };

  const isPast = (date: string) => {
    return new Date(date) < new Date();
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
          <h2 className="text-2xl font-bold">Jadwal Bimbingan</h2>
          <p className="text-muted-foreground">Kelola jadwal konsultasi dan bimbingan</p>
        </div>
        {profile?.role === 'lecturer' && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Buat Jadwal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Buat Jadwal Bimbingan</DialogTitle>
                <DialogDescription>
                  Atur jadwal bimbingan dengan mahasiswa
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSchedule} className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul Pertemuan</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Contoh: Bimbingan Bab 2"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="student">Mahasiswa</Label>
                  <Select 
                    value={formData.student_id} 
                    onValueChange={(value) => setFormData({...formData, student_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih mahasiswa" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} - {student.nim_nidn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="datetime">Tanggal & Waktu</Label>
                  <Input
                    id="datetime"
                    type="datetime-local"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Agenda dan catatan tambahan..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateModal(false)}
                  >
                    Batal
                  </Button>
                  <Button type="submit">Buat Jadwal</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {schedules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada jadwal</h3>
            <p className="text-muted-foreground mb-4">
              {profile?.role === 'lecturer' 
                ? 'Buat jadwal bimbingan dengan mahasiswa'
                : 'Belum ada jadwal bimbingan yang dijadwalkan'
              }
            </p>
            {profile?.role === 'lecturer' && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Buat Jadwal Pertama
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card 
              key={schedule.id} 
              className={`hover:shadow-md transition-shadow ${
                isUpcoming(schedule.scheduled_date) ? 'border-l-4 border-l-blue-500' :
                isPast(schedule.scheduled_date) && schedule.status === 'completed' ? 'border-l-4 border-l-green-500' :
                'border-l-4 border-l-gray-300'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-lg">{schedule.title}</h4>
                      <Badge className={getStatusColor(schedule.status)}>
                        {getStatusText(schedule.status)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(schedule.scheduled_date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(schedule.scheduled_date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })} WIB
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>
                          {profile?.role === 'student' 
                            ? `dengan ${schedule.lecturer?.full_name}`
                            : `dengan ${schedule.student?.full_name} (${schedule.student?.nim_nidn})`
                          }
                        </span>
                      </div>
                      
                      {schedule.thesis && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{schedule.thesis.title}</span>
                        </div>
                      )}
                    </div>
                    
                    {schedule.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Catatan:</strong> {schedule.notes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    {isUpcoming(schedule.scheduled_date) && profile?.role === 'lecturer' && (
                      <>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    
                    {isPast(schedule.scheduled_date) && schedule.status === 'scheduled' && profile?.role === 'lecturer' && (
                      <Button 
                        size="sm"
                        onClick={() => handleUpdateStatus(schedule.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Tandai Selesai
                      </Button>
                    )}
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