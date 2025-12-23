'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateSessionState } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, ArrowRight, Clock, Target, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function SprintConfirmationPage({ params: { id: sessionId } }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (user && sessionId) {
      getStudySession(sessionId)
        .then(sessionData => {
          if (sessionData && sessionData.userId === user.uid && sessionData.state === 'Pending') {
            setSession(sessionData);
          } else {
             // Redirect if session not found, not owned, or not pending
            toast({ variant: 'destructive', title: 'Error', description: 'Pending sprint not found.' });
            router.replace('/app/dashboard');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, sessionId, router, toast]);

  const handleStartSprint = async () => {
    if (!session) return;
    setIsStarting(true);
    try {
        await updateSessionState(sessionId, 'Active', { startTime: serverTimestamp() });
        toast({ title: 'Sprint Started!', description: 'Time to focus.' });
        router.push(`/app/sprint/${sessionId}/active`);
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not start sprint.' });
        setIsStarting(false);
    }
  };

  if (loading) {
    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
            <CardContent className="space-y-6">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
            <CardFooter><Skeleton className="h-10 w-32 ml-auto" /></CardFooter>
        </Card>
    );
  }

  if (!session) {
    return null; // or a not found component
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Commitment Confirmation</CardTitle>
          <CardDescription>You are about to start the following study sprint. Ready to focus?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Duration</h3>
                <p className="text-muted-foreground pl-7">{session.durationMinutes} minutes</p>
            </div>
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Next Action</h3>
                <p className="text-muted-foreground pl-7">{session.nextAction}</p>
            </div>
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Deliverable</h3>
                <p className="text-muted-foreground pl-7">{session.sprintDeliverable}</p>
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()} disabled={isStarting}>Cancel</Button>
            <Button onClick={handleStartSprint} disabled={isStarting}>
                {isStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Check className="mr-2 h-4 w-4" /> Start Sprint
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
