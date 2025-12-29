'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateSessionState } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { serverTimestamp } from 'firebase/firestore';
import { Loader2, CheckCircle, XCircle, Target, Rocket, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

export default function ActiveSprintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [blockerNote, setBlockerNote] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleEndSprint = useCallback(async (outcome: 'Completed' | 'Abandoned', optionalBlockerNote?: string) => {
    if (!session) return;
    try {
        await updateSessionState(id, outcome, {
            outcome,
            endTime: serverTimestamp(),
            ...(optionalBlockerNote && { optionalBlockerNote }),
        });

        if (outcome === 'Completed') {
            toast({ title: "Sprint complete!", description: "Great work! Take a short break." });
            setIsCompleted(true);
        } else {
            toast({ title: 'Sprint Abandoned' });
            router.push(`/app/assignments/${session.assignmentId}`);
            router.refresh();
        }

    } catch(error) {
        console.error("Failed to end sprint:", error)
        toast({ variant: 'destructive', title: 'Error', description: 'Could not end sprint.' });
    }
  }, [session, id, router, toast]);

  useEffect(() => {
    if (!user || !id) return;
    
    let isMounted = true;

    getStudySession(id)
      .then(sessionData => {
        if (!isMounted) return;

        if (sessionData && sessionData.userId === user.uid && sessionData.state === 'Active' && sessionData.startTime) {
          setSession(sessionData);
          const startTime = sessionData.startTime.toDate();
          const elapsedSeconds = (Date.now() - startTime.getTime()) / 1000;
          const initialRemaining = sessionData.durationMinutes * 60 - elapsedSeconds;
          
          if (initialRemaining <= 0) {
            handleEndSprint('Completed');
          } else {
            setTimeLeft(initialRemaining);
          }

        } else if (!isCompleted) {
          toast({ variant: 'destructive', title: 'Error', description: 'Active sprint not found or already completed.' });
          router.replace('/app/dashboard');
        }
      })
      .catch(error => {
        console.error("Failed to load sprint data:", error);
        if (!isCompleted) {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to load the sprint data.' });
          router.replace('/app/dashboard');
        }
      })
      .finally(() => {
        if(isMounted) setLoading(false)
      });
      
    return () => { isMounted = false; };
  }, [user, id, router, toast, handleEndSprint, isCompleted]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
        if(session && !isCompleted) handleEndSprint('Completed');
        return;
    };
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, session, isCompleted, handleEndSprint]);

  if (loading || session === null) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isCompleted) {
    return (
        <div className="container mx-auto max-w-2xl text-center">
            <Card>
                <CardHeader>
                    <CardTitle className="text-4xl font-headline">Congratulations!</CardTitle>
                    <CardDescription>You've completed your study sprint.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckCircle className="h-24 w-24 text-green-500 mx-auto animate-pulse" />
                    <p className="mt-4">You've made great progress. What's next?</p>
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/app/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Go to Dashboard
                    </Button>
                    <Button onClick={() => router.push(`/app/assignments/${session.assignmentId}`)}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Assignment
                    </Button>
                </CardFooter>
            </Card>
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
            {timeLeft !== null ? formatTime(timeLeft) : '...'}
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
