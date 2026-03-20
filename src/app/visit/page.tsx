
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
import { useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, getDocs, limit, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function VisitPage() {
  const router = useRouter();
  const db = useFirestore();
  const { toast } = useToast();
  
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otherDescription, setOtherDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedPurpose || !email.includes('@neu.edu.ph')) return;

    setIsSubmitting(true);

    try {
      // 1. Find User Profile by Email
      const profilesRef = collection(db, 'userProfiles');
      const q = query(profilesRef, where('institutionalEmail', '==', email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Institutional email not found. Please register your account first.");
        setIsSubmitting(false);
        return;
      }

      const userProfile = querySnapshot.docs[0].data();
      
      if (userProfile.accountStatus === 'blocked') {
        setError("Your account has been restricted. Please contact the library administrator.");
        setIsSubmitting(false);
        return;
      }

      // 2. AI Categorization if "Other"
      let finalCategorizedPurpose = selectedPurpose;
      if (selectedPurpose === 'Other' && otherDescription) {
        const aiResult = await categorizeVisitPurpose({ otherPurposeDescription: otherDescription });
        finalCategorizedPurpose = aiResult.categorizedPurpose;
      }
      
      // 3. Log Visit
      const visitLogsRef = collection(db, 'visitLogs');
      addDocumentNonBlocking(visitLogsRef, {
        visitorId: userProfile.id,
        entryTime: new Date().toISOString(), // Using ISO string as per backend.json format
        purpose: selectedPurpose,
        otherPurposeDetails: otherDescription || null,
        categorizedPurpose: finalCategorizedPurpose,
        // Denormalized fields for Admin efficiency
        visitorFullName: userProfile.fullName,
        visitorIdNumber: userProfile.idNumber,
        visitorRole: userProfile.role,
        visitorProgram: userProfile.program || null,
        visitorCollege: userProfile.college,
        visitorEmail: userProfile.institutionalEmail,
        createdAt: serverTimestamp(),
      });

      setShowSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      console.error(err);
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
          <p className="text-white/60 text-lg">Your entry has been recorded. Redirecting you shortly...</p>
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
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-2 font-headline">Library Entry Log</h2>
          <p className="text-muted-foreground">Select your purpose of visit and enter your NEU institutional email.</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8 border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Required</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              {error}
              {error.includes("not found") && (
                <Button variant="link" onClick={() => router.push('/admin/register')} className="text-destructive font-bold p-0 h-auto w-fit">
                  Register here
                </Button>
              )}
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
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="otherDesc">Describe your purpose</Label>
              <Textarea
                id="otherDesc"
                placeholder="Briefly explain your reason for visiting..."
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                required
                className="bg-card border-border/50"
              />
              <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> AI will help categorize your entry for better statistics.
              </p>
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-border/10">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-medium">Institutional Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@neu.edu.ph"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg bg-card border-border/50"
              />
              {!email.includes('@neu.edu.ph') && email.length > 5 && (
                <p className="text-destructive text-sm font-medium">Only NEU institutional emails are accepted.</p>
              )}
            </div>

            <Button 
              type="submit" 
              size="lg" 
              className="w-full h-14 text-xl font-bold"
              disabled={!selectedPurpose || !email.includes('@neu.edu.ph') || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Entry'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
