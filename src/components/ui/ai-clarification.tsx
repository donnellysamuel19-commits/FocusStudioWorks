
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Pencil, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { saveAiOutput } from '@/lib/firebase/firestore';
import { StudySession } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Mock GA event logger
const logEvent = (eventName: string, params: object) => {
  console.log(`GA Event: ${eventName}`, params);
  // In a real app, you would integrate with your analytics library
};

interface AiClarificationProps {
  session: StudySession;
}

export function AiClarification({ session }: AiClarificationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiOriginal, setAiOriginal] = useState('');
  const [humanEdited, setHumanEdited] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const getClarification = async () => {
      try {
        const response = await fetch('/api/ai/clarification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            assignmentTitle: session.assignmentTitle || 'Untitled Assignment',
            duration: session.durationMinutes,
            targetObject: session.targetObject,
            nextAction: session.nextAction,
            sprintDeliverable: session.sprintDeliverable,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch AI clarification');
        }

        const data = await response.json();
        setAiOriginal(data.result);
        setHumanEdited(data.result);
      } catch (error) {
        console.error('Error getting AI clarification:', error);
        setAiOriginal('Could not get AI clarification.');
      } finally {
        setIsLoading(false);
      }
    };

    getClarification();
  }, [user, session]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveAiOutput({
        userId: user.uid,
        assignmentId: session.assignmentId,
        featureName: 'feature1_commitment_clarification',
        aiOriginal: aiOriginal,
        humanEdited: humanEdited,
      });
      toast({ title: 'Success', description: 'Your feedback has been saved.' });
      setIsEditing(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save feedback.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedback = (feedbackValue: 'up' | 'down') => {
    if (!user) return;
    setFeedback(feedbackValue);
    logEvent('ai_feature1_feedback', {
      featureName: 'feature1_commitment_clarification',
      assignmentId: session.assignmentId,
      feedbackValue,
    });
    toast({ title: 'Feedback Submitted', description: 'Thank you for your feedback!' });
  };

  if (!user) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Clarification (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please sign in to use this feature.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Clarification (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">AI Clarification (Optional)</CardTitle>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}><Pencil className="h-4 w-4 mr-2"/>Edit</Button>
          ) : (
            <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}><Save className="h-4 w-4 mr-2"/>Save</Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={humanEdited}
          onChange={(e) => setHumanEdited(e.target.value)}
          readOnly={!isEditing}
          className="w-full min-h-[100px] p-2 bg-background"
        />
        <div className="flex justify-end items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">Helpful?</span>
            <Button variant={feedback === 'up' ? 'default' : 'outline'} size="icon" onClick={() => handleFeedback('up')} disabled={!!feedback}>
                <ThumbsUp className="h-4 w-4" />
            </Button>
            <Button variant={feedback === 'down' ? 'default' : 'outline'} size="icon" onClick={() => handleFeedback('down')} disabled={!!feedback}>
                <ThumbsDown className="h-4 w-4" />
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
