'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignment, getSessionsForAssignment, deleteStudySession } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, PlusCircle, CheckCircle, XCircle, PlayCircle, Hourglass, MoreVertical, Edit, Trash2, Info, ThumbsUp, ThumbsDown, Sparkles } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logAnalyticsEvent } from '@/lib/analytics';

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentGoal | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [detailedSession, setDetailedSession] = useState<StudySession | null>(null);

  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const fetchAssignmentData = useCallback(async () => {
    if (!user || !id) return;

    setLoading(true);

    const maxAttempts = 5;
    const delay = 400; 

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const assignmentData = await getAssignment(id);

            if (assignmentData && assignmentData.userId === user.uid) {
                const sessionsData = await getSessionsForAssignment(id, user.uid);
                setAssignment(assignmentData);
                setSessions(sessionsData);
                setLoading(false);
                return; 
            }
        } catch (err) {
            console.error("Fetch attempt failed:", err);
        }

        if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }

    toast({ variant: 'destructive', title: 'Error', description: "Assignment not found or you don't have permission." });
    router.push('/dashboard');
    setLoading(false);

}, [user, id, toast, router]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  const handleGetNextStudyIdea = async () => {
    if (!user) return;
    setIsAiLoading(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const response = await fetch('/api/nextSprintSuggestionFlow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignmentId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch suggestion.');
      }

      const { suggestion } = await response.json();
      setAiSuggestion(suggestion);
    } catch (error: any) {
      setAiError(error.message || 'Unable to generate a suggestion right now.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleFeedback = (feedback: 'up' | 'down') => {
    if(!user || !id) return;
    logAnalyticsEvent('ai_feature2_feedback', {
      assignmentId: id,
      feedbackValue: feedback,
    });
    toast({ title: 'Feedback submitted', description: 'Thank you for your feedback!' });
  };

  const handleDeleteSession = () => {
    if (!sessionToDelete) return;
    const sessionId = sessionToDelete;
    setIsDeleting(true);
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    setSessionToDelete(null);

    deleteStudySession(sessionId)
      .then(() => {
        toast({ title: 'Success', description: 'Sprint has been deleted.' });
      })
      .catch((error) => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the sprint.' });
        fetchAssignmentData(); 
      })
      .finally(() => {
        setIsDeleting(false);
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return null; 
  }

  const getStatusIcon = (status: StudySession['state']) => {
    switch(status) {
        case 'Completed': return <CheckCircle className="text-green-400" />;
        case 'Abandoned': return <XCircle className="text-red-400" />;
        case 'Active': return <PlayCircle className="text-blue-400 animate-pulse" />;
        case 'Pending': return <Hourglass className="text-yellow-400" />;
        default: return null;
    }
  }

  const getStatusBadgeVariant = (status: StudySession['state']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Abandoned': return 'destructive';
      case 'Active': return 'secondary';
      case 'Pending': return 'outline';
      default: return 'secondary';
    }
  };

  const SessionDetailDialog = ({ session }: { session: StudySession }) => (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Sprint Details</DialogTitle>
        <DialogDescription>
          A read-only view of your study sprint for "{session.targetObject}".
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-muted-foreground col-span-1">Duration</div>
          <p className="col-span-2">{session.durationMinutes} minutes</p>
        </div>
         <div className="grid grid-cols-3 gap-2">
          <div className="text-muted-foreground col-span-1">Next Action</div>
          <p className="col-span-2">{session.nextAction}</p>
        </div>
         <div className="grid grid-cols-3 gap-2">
          <div className="text-muted-foreground col-span-1">Deliverable</div>
          <p className="col-span-2">{session.sprintDeliverable}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-muted-foreground col-span-1">Status</div>
          <div className="col-span-2">
            <Badge variant={getStatusBadgeVariant(session.state)}>{session.state}</Badge>
          </div>
        </div>
        {session.startTime?.toDate && (
           <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground col-span-1">Started</div>
            <p className="col-span-2">{format(session.startTime.toDate(), 'PPpp')}</p>
          </div>
        )}
        {session.endTime?.toDate && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground col-span-1">Ended</div>
            <p className="col-span-2">{format(session.endTime.toDate(), 'PPpp')}</p>
          </div>
        )}
        {session.outcome && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground col-span-1">Outcome</div>
            <p className="col-span-2">{session.outcome}</p>
          </div>
        )}
        {session.optionalBlockerNote && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-muted-foreground col-span-1">Blocker</div>
            <p className="col-span-2 text-destructive/80">{session.optionalBlockerNote}</p>
          </div>
        )}
      </div>
    </DialogContent>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold font-headline mb-4">Assignment Details</h1>
        <h2 className="text-3xl font-bold font-headline">{assignment.title}</h2>
        {assignment.optionalDeadline?.toDate && (
          <p className="text-muted-foreground flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4" />
            Deadline: {format(assignment.optionalDeadline.toDate(), 'PPP')}
          </p>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
            <CardTitle>Next Sprint Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
            {sessions.length === 0 ? (
                <p className="text-muted-foreground">Complete at least one study sprint to receive suggestions.</p>
            ) : (
                <div className="space-y-4">
                <Button onClick={handleGetNextStudyIdea} disabled={isAiLoading}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isAiLoading ? 'Generating...' : 'Get Next Study Idea'}
                </Button>
                {aiSuggestion && (
                    <Card className="bg-secondary/50">
                    <CardHeader>
                        <CardTitle className="text-lg">AI Suggested Next Sprint (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{aiSuggestion}</p>
                        <div className="flex justify-end gap-2 mt-4">
                        <Button variant="ghost" size="icon" onClick={() => handleFeedback('up')}>
                            <ThumbsUp className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleFeedback('down')}>
                            <ThumbsDown className="h-5 w-5" />
                        </Button>
                        </div>
                    </CardContent>
                    </Card>
                )}
                {aiError && (
                    <p className="text-red-500">{aiError}</p>
                )}
                </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Study Sprints</CardTitle>
                <CardDescription>A history of all your study sprints for this assignment.</CardDescription>
            </div>
          <Button asChild>
            <Link href={`/assignments/${assignment.id}/sprint/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Sprint
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No study sprints recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="border p-4 rounded-lg flex items-center justify-between gap-4 bg-card text-card-foreground">
                    <div className='flex items-center gap-4 flex-1 min-w-0'>
                        <div className='hidden sm:block'>
                           {getStatusIcon(session.state)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className='font-semibold truncate' title={session.targetObject}>{session.targetObject}</p>
                            <p className='text-sm text-muted-foreground'>
                                {session.createdAt?.toDate ? `${formatDistanceToNow(session.createdAt.toDate(), { addSuffix: true })} • ` : ''}{session.durationMinutes} min
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {session.state === 'Pending' && (
                             <Button asChild size="sm">
                                <Link href={`/sprint/${session.id}`}>
                                    <PlayCircle className="mr-2 h-4 w-4"/>
                                    Start
                                </Link>
                            </Button>
                        )}
                        {session.state === 'Active' && (
                             <Button asChild size="sm" variant="secondary">
                                <Link href={`/sprint/${session.id}/active`}>
                                    <PlayCircle className="mr-2 h-4 w-4"/>
                                    Resume
                                </Link>
                            </Button>
                        )}

                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => setDetailedSession(session)}>
                                <Info className="mr-2 h-4 w-4" />
                                <span>Details</span>
                              </DropdownMenuItem>
                              {session.state === 'Pending' && (
                                <>
                                  <DropdownMenuItem onSelect={() => router.push(`/assignments/${assignment.id}/sprint/edit/${session.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onSelect={() => setSessionToDelete(session.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete this pending sprint. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting} onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSession} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!detailedSession} onOpenChange={(open) => !open && setDetailedSession(null)}>
        {detailedSession && <SessionDetailDialog session={detailedSession} />}
      </Dialog>

    </div>
  );
}
