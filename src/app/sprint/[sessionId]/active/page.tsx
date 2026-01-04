'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateSessionState } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Loader2, AlertTriangle, Target, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const pad = (num: number) => num.toString().padStart(2, '0');

export default function SprintTimerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [abandonReason, setAbandonReason] = useState('');

  useEffect(() => {
    if (user && sessionId) {
      getStudySession(sessionId).then(sessionData => {
        if (sessionData && sessionData.userId === user.uid && sessionData.state === 'Active') {
          setSession(sessionData);
          // Start the timer from the full duration for a better UX
          setTimeLeft(sessionData.durationMinutes * 60 * 1000);
        } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Active sprint not found.' });
          router.replace('/dashboard');
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, sessionId, router, toast]);

  useEffect(() => {
    if (timeLeft === null) return;

    if (timeLeft <= 0) {
        updateSessionState(sessionId, 'Completed').then(() => {
            toast({ title: "Time's up!", description: 'Sprint completed successfully.' });
            router.push(`/sprint/${sessionId}/summary`);
        });
      return;
    }

    const timer = setInterval(() => {
      // Ensure the timer doesn't go below zero
      setTimeLeft(prev => Math.max(0, (prev || 0) - 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, sessionId, router, toast]);

  const handleAbandonSprint = async () => {
    try {
      await updateSessionState(sessionId, 'Abandoned', { abandonReason });
      toast({ variant: 'destructive', title: 'Sprint Abandoned', description: 'You can start a new sprint anytime.' });
      router.push(`/assignments/${session?.assignmentId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not abandon sprint.' });
    }
  };

  if (loading || !session) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const minutes = Math.floor((timeLeft ?? 0) / 60000);
  const seconds = Math.floor(((timeLeft ?? 0) % 60000) / 1000);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center">
            <p className="text-9xl font-bold tracking-tighter tabular-nums">{pad(minutes)}:{pad(seconds)}</p>
            <p className="text-2xl text-gray-400">Time to Focus!</p>
        </div>

        <div className="w-full max-w-lg my-12 space-y-4">
            <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <Target className="h-6 w-6 mr-4 text-blue-400" />
                <div>
                    <h3 className="font-semibold">Next Action</h3>
                    <p className="text-gray-300">{session.nextAction}</p>
                </div>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg flex items-center">
                <Rocket className="h-6 w-6 mr-4 text-blue-400" />
                <div>
                    <h3 className="font-semibold">Deliverable</h3>
                    <p className="text-gray-300">{session.sprintDeliverable}</p>
                </div>
            </div>
        </div>

        <AlertDialog>
        <AlertDialogTrigger asChild>
            <Button variant="destructive" size="lg" className="bg-red-600 hover:bg-red-700 text-white text-lg">Abandon Sprint</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><AlertTriangle/>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
                Abandoning this sprint will mark it as incomplete. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4">
            <Label htmlFor="abandon-reason" className="text-gray-300">Reason for abandoning (optional)</Label>
            <Textarea id="abandon-reason" value={abandonReason} onChange={(e) => setAbandonReason(e.target.value)} placeholder="e.g., I got stuck, I need a break..." className="bg-gray-900 border-gray-700 text-white" />
            </div>
            <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAbandonSprint} className="bg-red-600 hover:bg-red-700 text-white">Abandon</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
