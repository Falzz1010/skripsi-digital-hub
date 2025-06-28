
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Mail, Lock } from "lucide-react";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: 'student' | 'lecturer') => void;
}

export const LoginModal = ({ isOpen, onClose, onLogin }: LoginModalProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (role: 'student' | 'lecturer') => {
    // Simulate login - in real app this would connect to backend/Supabase
    onLogin(role);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Masuk ke SISKRIPSI</DialogTitle>
          <DialogDescription className="text-center">
            Pilih peran Anda untuk mengakses sistem
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="student" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Mahasiswa</span>
            </TabsTrigger>
            <TabsTrigger value="lecturer" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Dosen</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="student">
            <Card>
              <CardHeader className="text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Login Mahasiswa</CardTitle>
                <CardDescription>
                  Masuk untuk mengakses dashboard dan upload skripsi
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email / NIM</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="student-email"
                      placeholder="email@kampus.ac.id"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="student-password"
                      type="password"
                      placeholder="Masukkan password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleLogin('student')}
                >
                  Masuk Sebagai Mahasiswa
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lecturer">
            <Card>
              <CardHeader className="text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Login Dosen</CardTitle>
                <CardDescription>
                  Masuk untuk mengakses dashboard dan kelola bimbingan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lecturer-email">Email / NIDN</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lecturer-email"
                      placeholder="dosen@kampus.ac.id"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lecturer-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="lecturer-password"
                      type="password"
                      placeholder="Masukkan password"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleLogin('lecturer')}
                >
                  Masuk Sebagai Dosen
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-gray-500">
          Demo Mode - Klik tombol manapun untuk masuk
        </div>
      </DialogContent>
    </Dialog>
  );
};
