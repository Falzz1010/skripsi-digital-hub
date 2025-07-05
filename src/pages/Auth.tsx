import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {  
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-secondary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-primary to-secondary p-4 rounded-2xl shadow-lg">
              <GraduationCap className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SISKRIPSI
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              Sistem Informasi Manajemen Skripsi
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="signin" className="text-base">
                Masuk
              </TabsTrigger>
              <TabsTrigger value="signup" className="text-base">
                Daftar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-6">
              <SignInForm isLoading={isLoading} setIsLoading={setIsLoading} />
            </TabsContent>

            <TabsContent value="signup" className="mt-6">
              <SignUpForm isLoading={isLoading} setIsLoading={setIsLoading} />
            </TabsContent>
          </Tabs>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Dengan mendaftar, Anda menyetujui{" "}
              <span className="text-primary hover:underline cursor-pointer">
                syarat dan ketentuan
              </span>{" "}
              yang berlaku
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;