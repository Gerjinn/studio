"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/Logo';
import { ArrowLeft, Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useFirestore } from '@/firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '@/firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COLLEGES } from '@/lib/mock-data';

export default function RegisterPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    idNumber: '',
    role: 'Student',
    college: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = formData.email.toLowerCase().trim();
    
    if (!normalizedEmail.endsWith('@neu.edu.ph')) {
      toast({
        variant: "destructive",
        title: "Invalid Domain",
        description: "Please use your @neu.edu.ph institutional email.",
      });
      return;
    }

    if (!formData.college) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please select a college.",
      });
      return;
    }

    setIsLoading(true);
    
    // Create a secondary app instance to prevent the admin from being logged out
    const tempAppName = `temp-reg-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, tempAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      // 1. Create Auth User using the secondary instance
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, formData.password);
      const newUser = userCredential.user;

      // 2. Create User Profile in Firestore using the primary db instance
      await setDoc(doc(db, 'userProfiles', newUser.uid), {
        id: newUser.uid,
        institutionalEmail: normalizedEmail,
        fullName: formData.fullName,
        idNumber: formData.idNumber,
        role: formData.role,
        college: formData.college,
        accountStatus: 'active',
      });

      // 3. If the role is Admin or Employee, grant dashboard access via roles_admin
      if (formData.role === 'Admin' || formData.role === 'Employee') {
        await setDoc(doc(db, 'roles_admin', newUser.uid), {
          email: normalizedEmail,
          assignedAt: new Date().toISOString(),
          role: formData.role
        });
      }

      toast({
        title: "Account Created",
        description: "User profile and permissions have been initialized successfully.",
      });
      
      router.push('/admin/accounts');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
      });
    } finally {
      // Clean up the secondary app instance
      await deleteApp(secondaryApp);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center neu-gradient p-4 py-12">
      <div className="absolute top-8 left-8">
        <Button variant="ghost" onClick={() => router.push('/admin/accounts')} className="text-white/70">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
      </div>

      <Card className="w-full max-w-2xl bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo className="w-16 h-16" />
          </div>
          <CardTitle className="text-3xl font-bold text-white font-headline">Add New User Profile</CardTitle>
          <CardDescription className="text-white/60">
            Create an official account for a student, faculty, or staff member
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
                <Label className="text-white/80">Initial Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-black/20 border-white/10 text-white h-12 pr-12"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full w-12 text-white/40 hover:text-white hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </Button>
                </div>
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
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">College</Label>
                <Select onValueChange={(v) => setFormData({ ...formData, college: v })}>
                  <SelectTrigger className="bg-black/20 border-white/10 text-white h-12">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent>
                    {COLLEGES.map((college) => (
                      <SelectItem key={college} value={college}>
                        {college}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        </CardContent>
      </Card>
    </div>
  );
}
