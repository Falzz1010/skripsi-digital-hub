import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookOpen, Mail, Lock, User, Phone, Building, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cleanupAuthState, getAuthErrorMessage } from "@/lib/auth-utils";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database['public']['Enums']['user_role'];

interface SignUpFormProps {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface FormData {
  email: string;
  password: string;
  fullName: string;
  nimNidn: string;
  phone: string;
  department: string;
  role: UserRole;
}

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  nimNidn?: string;
  department?: string;
}

export const SignUpForm = ({ isLoading, setIsLoading }: SignUpFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    fullName: "",
    nimNidn: "",
    phone: "",
    department: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const navigate = useNavigate();

  const updateFormData = (field: keyof FormData, value: string | UserRole) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.email) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    
    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Nama lengkap wajib diisi";
    }
    
    if (!formData.nimNidn.trim()) {
      newErrors.nimNidn = `${formData.role === 'student' ? 'NIM' : 'NIDN'} wajib diisi`;
    }
    
    if (!formData.department.trim()) {
      newErrors.department = "Jurusan/Program Studi wajib diisi";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});

    try {
      // Clean up existing state
      cleanupAuthState();
      
      // Attempt global sign out first
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }

      const { data, error } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: formData.fullName.trim(),
            role: formData.role,
            nim_nidn: formData.nimNidn.trim(),
            phone: formData.phone.trim(),
            department: formData.department.trim(),
          }
        }
      });

      if (error) {
        toast.error(getAuthErrorMessage(error));
        return;
      }

      if (data.user) {
        toast.success("Registrasi berhasil! Silakan cek email untuk verifikasi.");
        // Force page reload for clean state
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error("Terjadi kesalahan saat registrasi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="role">Peran</Label>
        <Select 
          value={formData.role} 
          onValueChange={(value: UserRole) => updateFormData('role', value)}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Mahasiswa</span>
              </div>
            </SelectItem>
            <SelectItem value="lecturer">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Dosen</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Nama Lengkap</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="fullName"
              placeholder="Masukkan nama lengkap"
              className="pl-10"
              value={formData.fullName}
              onChange={(e) => updateFormData('fullName', e.target.value)}
              disabled={isLoading}
            />
          </div>
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nimNidn">{formData.role === 'student' ? 'NIM' : 'NIDN'}</Label>
          <Input
            id="nimNidn"
            placeholder={formData.role === 'student' ? 'Masukkan NIM' : 'Masukkan NIDN'}
            value={formData.nimNidn}
            onChange={(e) => updateFormData('nimNidn', e.target.value)}
            disabled={isLoading}
          />
          {errors.nimNidn && (
            <p className="text-sm text-destructive">{errors.nimNidn}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="email@kampus.ac.id"
            className="pl-10"
            value={formData.email}
            onChange={(e) => updateFormData('email', e.target.value)}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Nomor Telepon</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              className="pl-10"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">Jurusan/Program Studi</Label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="department"
              placeholder="Contoh: Teknik Informatika"
              className="pl-10"
              value={formData.department}
              onChange={(e) => updateFormData('department', e.target.value)}
              disabled={isLoading}
            />
          </div>
          {errors.department && (
            <p className="text-sm text-destructive">{errors.department}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 6 karakter"
            className="pl-10 pr-10"
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={isLoading}
        variant="secondary"
      >
        {isLoading ? "Memproses..." : "Daftar"}
      </Button>
    </form>
  );
};