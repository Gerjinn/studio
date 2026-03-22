
"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { VISIT_PURPOSES } from '@/lib/mock-data';
import { CheckCircle2, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categorizeVisitPurpose } from '@/ai/flows/ai-purpose-categorization-flow';
import { Textarea } from '@/components/ui/textarea';
import { useFirestore, useAuth, addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, limit, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export default function VisitPage() {
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otherDescription, setOtherDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainError, setDomainError] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    setDomainError(false);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email?.toLowerCase().endsWith('@neu.edu.ph')) {
        await signOut(auth);
        setError("Only @neu.edu.ph institutional Google accounts are permitted.");
        return;
      }

      const normalizedEmail = user.email.toLowerCase();
      const profileRef = doc(db, 'userProfiles', user.uid);
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        await setDoc(profileRef, {
          id: user.uid,
          institutionalEmail: normalizedEmail,
          fullName: user.displayName || 'NEU Visitor',
          idNumber: 'AUTO-PROVISIONED',
          role: 'Student',
          college: 'Unassigned',
          accountStatus: 'active',
          createdAt: new Date().toISOString()
        });
      } else {
        const userProfile = profileSnap.data();
        if (userProfile.accountStatus === 'blocked') {
          await signOut(auth);
          setError("ACCESS DENIED: Your library privileges have been suspended.");
          return;
        }
      }

      setEmail(normalizedEmail);
      toast({
        title: "Authenticated",
        description: `Welcome, ${user.displayName}. Please select your purpose and submit.`,
      });
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain') {
        setDomainError(true);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: err.message || "Could not sign in with Google.",
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!selectedPurpose || !normalizedEmail.endsWith('@neu.edu.ph')) {
      setError("Please provide a valid @neu.edu.ph institutional email.");
      return;
    }

    setIsSubmitting(true);

    try {
      const profilesRef = collection(db, 'userProfiles');
      const q = query(profilesRef, where('institutionalEmail', '==', normalizedEmail), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Visitor profile not found. Please try 'Quick Login with Google' for automatic entry.");
        setIsSubmitting(false);
        return;
      }

      const userProfile = querySnapshot.docs[0].data();
      if (userProfile.accountStatus === 'blocked') {
        setError("Your account is currently BLOCKED from library entry.");
        setIsSubmitting(false);
        return;
      }

      let finalCategorizedPurpose = selectedPurpose;
      if (selectedPurpose === 'Other' && otherDescription) {
        try {
          const aiResult = await categorizeVisitPurpose({ otherPurposeDescription: otherDescription });
          finalCategorizedPurpose = aiResult.categorizedPurpose;
        } catch (err) {
          finalCategorizedPurpose = selectedPurpose;
        }
      }
      
      const visitLogsRef = collection(db, 'visitLogs');
      addDocumentNonBlocking(visitLogsRef, {
        visitorId: userProfile.id,
        entryTime: new Date().toISOString(),
        purpose: selectedPurpose,
        otherPurposeDetails: otherDescription || null,
        categorizedPurpose: finalCategorizedPurpose,
        visitorFullName: userProfile.fullName,
        visitorIdNumber: userProfile.idNumber,
        visitorRole: userProfile.role,
        visitorCollege: userProfile.college,
        visitorEmail: userProfile.institutionalEmail,
        createdAt: serverTimestamp(),
      });

      setShowSuccess(true);
      setTimeout(() => router.push('/'), 3000);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: err.message || "Failed to record your visit.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center neu-gradient p-4">
        <div className="text-center animate-in zoom-in duration-500">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-500/20 p-4">
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 font-headline">Thank you for your visit!</h2>
          <p className="text-white/60 text-lg">Your entry has been recorded. Redirecting shortly...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <header className="p-4 border-b border-border/10 bg-card/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-xl font-bold font-headline hidden sm:block">NEU Library</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')} className="text-white/70">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Welcome
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl py-12 px-4">
        {domainError && (
          <Alert variant="destructive" className="mb-8 border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Action Required</AlertTitle>
            <AlertDescription>
              This domain is not authorized. Please add this domain to the Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains: <br/>
              <code className="bg-black/20 px-1 rounded mt-1 inline-block">{typeof window !== 'undefined' ? window.location.hostname : 'your-domain.com'}</code>
            </AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2 font-headline">Library Entry Log</h2>
          <p className="text-muted-foreground">Select your purpose of visit and identify yourself.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="font-bold">Verification Failed</AlertTitle>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {VISIT_PURPOSES.map((purpose) => (
              <button
                key={purpose}
                type="button"
                onClick={() => setSelectedPurpose(purpose)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all text-center flex flex-col items-center justify-center gap-2 group",
                  selectedPurpose === purpose 
                    ? "border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10" 
                    : "border-border/50 bg-card hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                <span className="font-semibold text-lg">{purpose}</span>
              </button>
            ))}
          </div>

          {selectedPurpose === 'Other' && (
            <div className="space-y-2">
              <Label htmlFor="otherDesc">Describe your purpose</Label>
              <Textarea
                id="otherDesc"
                placeholder="Briefly explain your reason..."
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                required
                className="bg-card border-border/50"
              />
            </div>
          )}

          <div className="space-y-6 pt-6 border-t border-border/10">
             <Button 
              type="button"
              variant="outline" 
              className="w-full h-14 bg-white text-black hover:bg-gray-100 border-none flex items-center justify-center gap-3 font-bold shadow-md"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Quick Login with Google
            </Button>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground uppercase font-bold">or manual entry</span>
              <Separator className="flex-1" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Institutional Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@neu.edu.ph"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 bg-card border-border/50"
              />
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-16 text-xl font-bold"
              disabled={!selectedPurpose || !email.toLowerCase().includes('@neu.edu.ph') || isSubmitting}
            >
              {isSubmitting ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : 'Submit Entry'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
