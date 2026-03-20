
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Loader2, UserPlus, ShieldAlert } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RegisterPage() {
  const router = useRouter();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    idNumber: '',
    role: 'Student',
    college: '',
    program: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.includes('@neu.edu.ph')) {
      toast({
        variant: "destructive",
        title: "Invalid Domain",
        description: "Please use your @neu.edu.ph institutional email.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create User Profile in Firestore
      await setDoc(doc(db, 'userProfiles', user.uid), {
        id: user.uid,
        institutionalEmail: formData.email,
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        role: formData.role,
        college: formData.college,
        program: formData.program,
        accountStatus: 'active',
      });

      toast({
        title: "Account Created",
        description: "Your NEU institutional account has been registered successfully.",
      });
      
      router.push('/admin/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center neu-gradient p-4 py-12">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" onClick={() => router.push('/admin/login')} className="text-white/70">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Login
        </Button>
      </div>

      <Card className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl font-bold text-white font-headline">Register Account</CardTitle>
          <CardDescription className="text-white/60">
            Create your official library institutional profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/80">Full Name</Label>
                <Input
                  required
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-black/20 border-white/10 text-white h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Institutional Email</Label>
                <Input
                  type="email"
                  required
                  placeholder="name@neu.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-black/20 border-white/10 text-white h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">ID Number</Label>
                <Input
                  required
                  placeholder="2023-XXXX"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className="bg-black/20 border-white/10 text-white h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Password</Label>
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-black/20 border-white/10 text-white h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Role</Label>
                <Select onValueChange={(v) => setFormData({ ...formData, role: v })} defaultValue="Student">
                  <SelectTrigger className="bg-black/20 border-white/10 text-white h-12">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Employee">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">College</Label>
                <Input
                  required
                  placeholder="e.g. CICS"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  className="bg-black/20 border-white/10 text-white h-12"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 text-xl font-bold gap-2"
              disabled={isLoading || !formData.email.includes('@neu.edu.ph')}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-6 w-6" />
                  Register Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/60">
              Already have an account?{' '}
              <Link href="/admin/login" className="text-primary hover:underline font-bold">
                Login here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
