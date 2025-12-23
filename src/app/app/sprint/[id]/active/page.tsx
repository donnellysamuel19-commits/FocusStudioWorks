'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateSessionState } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle, Target, Rocket } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ActiveSprintPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [blockerNote, setBlockerNote] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    
    getStudySession(id)
      .then(sessionData => {
        if (sessionData && sessionData.userId === user.uid && sessionData.state === 'Active' && sessionData.startTime) {
          setSession(sessionData);
          const elapsedSeconds = (Date.now() - sessionData.startTime.toDate().getTime()) / 1000;
          const initialRemaining = sessionData.durationMinutes * 60 - elapsedSeconds;
          setTimeLeft(Math.max(0, initialRemaining));
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Active sprint not found.' });
          router.replace('/app/dashboard');
        }
      })
      .catch(error => {
        console.error("Failed to load sprint data:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load the sprint data.' });
        router.replace('/app/dashboard');
      })
      .finally(() => setLoading(false));
    
  }, [user, id, router, toast]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  const handleEndSprint = useCallback(async (outcome: 'Completed' | 'Abandoned', optionalBlockerNote?: string) => {
    if (!session) return;
    try {
        await updateSessionState(id, outcome, {
            outcome,
            endTime: serverTimestamp(),
            ...(optionalBlockerNote && { optionalBlockerNote }),
        });
        toast({ title: `Sprint ${outcome}`, description: "Great work! Take a short break." });
        router.push(`/app/assignments/${session.assignmentId}`);
        router.refresh();
    } catch(error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not end sprint.' });
    }
  }, [session, id, router, toast]);

  useEffect(() => {
    if (timeLeft !== null && timeLeft <= 0 && session) {
        handleEndSprint('Completed');
    }
  }, [timeLeft, session, handleEndSprint]);

  if (loading || session === null || timeLeft === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto max-w-2xl">
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold font-mono tabular-nums">
            {formatTime(timeLeft)}
          </CardTitle>
          <CardDescription>Time to Focus!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-left">
           <div className="p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Next Action</h3>
                <p className="text-muted-foreground pl-7">{session.nextAction}</p>
            </div>
            <div className="p-4 border rounded-lg bg-secondary/50">
                <h3 className="font-semibold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Deliverable</h3>
                <p className="text-muted-foreground pl-7">{session.sprintDeliverable}</p>
            </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex justify-center gap-4">
        <Button size="lg" onClick={() => handleEndSprint('Completed')}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Complete Sprint
        </Button>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button size="lg" variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Abandon Sprint
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Abandon Sprint?</AlertDialogTitle>
                    <AlertDialogDescription>
                        It's okay to stop. What got in your way? (Optional)
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea 
                    placeholder="e.g., The instructions were unclear, I felt tired..."
                    value={blockerNote}
                    onChange={(e) => setBlockerNote(e.target.value)}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Continue Sprint</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleEndSprint('Abandoned', blockerNote)}>Confirm Abandon</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
