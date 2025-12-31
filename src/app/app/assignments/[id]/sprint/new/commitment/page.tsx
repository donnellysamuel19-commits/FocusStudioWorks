'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateSessionState, addAiOutput } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Check, Clock, Target, Rocket, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { serverTimestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { logAnalyticsEvent } from '@/lib/analytics';
import { runFlow } from '@genkit-ai/flow/client';
import { commitmentClarificationFlow } from '@/ai/flows/commitment';

export default function CommitmentConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assignmentId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const { toast } = useToast();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiOriginal, setAiOriginal] = useState<string | null>(null);
  const [aiHumanEdited, setAiHumanEdited] = useState<string | null>(null);
  const [aiOutputSaved, setAiOutputSaved] = useState(false);

  useEffect(() => {
    if (user && sessionId) {
      getStudySession(sessionId)
        .then(sessionData => {
          if (sessionData && sessionData.userId === user.uid) {
            setSession(sessionData);
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Sprint not found.' });
            router.replace('/app/dashboard');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, sessionId, router, toast]);

  const handleStartSprint = async () => {
    if (!session || !sessionId) return;
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

  const handleAiCheck = useCallback(async () => {
    if (!user) {
        setAiError("Sign in to use AI clarification.");
        return;
    }
    if (!session) return;

    setAiLoading(true);
    setAiError(null);
    setAiOriginal(null);
    setAiHumanEdited(null);
    setAiOutputSaved(false);

    try {
      const response = await runFlow(commitmentClarificationFlow, {
        durationMinutes: session.durationMinutes,
        targetObject: session.targetObject,
        nextAction: session.nextAction,
        sprintDeliverable: session.sprintDeliverable,
      });

      setAiOriginal(response);
      setAiHumanEdited(response);
    } catch (error) {
        console.error("AI clarification failed:", error);
        setAiError("AI unavailable — continue without it");
    } finally {
        setAiLoading(false);
    }
  }, [user, session]);

 const handleSaveAiOutput = async () => {
    if (!user || !aiOriginal || !aiHumanEdited) return;
    try {
      await addAiOutput(user.uid, assignmentId, aiOriginal, aiHumanEdited);
      toast({ title: 'Success', description: 'AI clarification has been saved.' });
      setAiOutputSaved(true);
    } catch (error) {
      console.error("Failed to save AI output:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save AI output.' });
    }
  };

  const handleFeedback = (feedbackValue: 'up' | 'down') => {
    logAnalyticsEvent('ai_feature1_feedback', {
      featureName: 'feature1_commitment_clarification',
      assignmentId,
      feedbackValue,
    });
    toast({ title: 'Feedback submitted', description: 'Thank you for your feedback!' });
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
    return null;
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

            {/* --- AI Feature Section --- */}
            <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">AI Assistant</h3>
                    <Button variant="outline" size="sm" onClick={handleAiCheck} disabled={aiLoading}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {aiLoading ? 'Checking...' : 'AI Check (Optional)'}
                    </Button>
                </div>
                {aiError && <p className="text-sm text-destructive text-center">{aiError}</p>}
                
                {aiLoading && <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>}

                {aiHumanEdited !== null && (
                    <div className="space-y-2">
                        <Label htmlFor="ai-output">AI Clarification (Optional)</Label>
                        <Textarea 
                            id="ai-output"
                            value={aiHumanEdited}
                            onChange={(e) => setAiHumanEdited(e.target.value)}
                            className="bg-secondary/50"
                            rows={5}
                        />
                        <div className="flex items-center justify-end gap-2 pt-2">
                             <Button variant="ghost" size="icon" onClick={() => handleFeedback('up')}>
                                <ThumbsUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleFeedback('down')}>
                                <ThumbsDown className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={handleSaveAiOutput} disabled={aiOutputSaved || !aiHumanEdited.trim()}>
                                {aiOutputSaved ? 'Saved' : 'Save'}
                            </Button>
                        </div>
                    </div>
                )}
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
