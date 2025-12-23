'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignment, getSessionsForAssignment, deleteStudySession } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, PlusCircle, CheckCircle, XCircle, PlayCircle, Hourglass, Edit, Trash2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentGoal | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = (assignmentId: string) => {
    getSessionsForAssignment(assignmentId)
      .then(sessionsData => {
          setSessions(sessionsData);
      })
      .catch(console.error);
  }

  useEffect(() => {
    if (user && params.id) {
      setLoading(true);
      Promise.all([
        getAssignment(params.id),
        getSessionsForAssignment(params.id),
      ]).then(([assignmentData, sessionsData]) => {
        if (assignmentData && assignmentData.userId === user.uid) {
            setAssignment(assignmentData);
            setSessions(sessionsData);
        } else {
            // Handle not found or unauthorized
        }
      }).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, params.id]);
  
  const handleDeleteSession = async (sessionId: string) => {
    try {
      await deleteStudySession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      toast({ title: 'Sprint Deleted', description: 'The pending sprint has been removed.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete sprint.' });
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assignment) {
    return <p>Assignment not found or you don't have permission to view it.</p>;
  }

  const getStatusIcon = (status: StudySession['state']) => {
    switch(status) {
        case 'Completed': return <CheckCircle className="text-green-500" />;
        case 'Abandoned': return <XCircle className="text-red-500" />;
        case 'Active': return <PlayCircle className="text-blue-500" />;
        case 'Pending': return <Hourglass className="text-yellow-500" />;
        default: return null;
    }
  }

  return (
    <div className="container mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">{assignment.title}</h1>
        {assignment.optionalDeadline && (
          <p className="text-muted-foreground flex items-center gap-2 mt-2">
            <Clock className="h-4 w-4" />
            Deadline: {format(assignment.optionalDeadline.toDate(), 'PPP')}
          </p>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Study Sprints</CardTitle>
                <CardDescription>A history of all your study sprints for this assignment.</CardDescription>
            </div>
          <Button asChild>
            <Link href={`/app/assignments/${assignment.id}/sprint/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Start New Sprint
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No study sprints recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {sessions.map(session => (
                <div key={session.id} className="border p-4 rounded-lg flex items-center justify-between">
                    <div className='flex items-center gap-4'>
                        <div className='hidden sm:block'>
                           {getStatusIcon(session.state)}
                        </div>
                        <div>
                            <p className='font-semibold'>{session.targetObject}</p>
                            <p className='text-sm text-muted-foreground'>
                                {formatDistanceToNow(session.createdAt.toDate(), { addSuffix: true })} • {session.durationMinutes} min sprint
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {session.state === 'Pending' && (
                            <>
                             <Button variant="ghost" size="icon" asChild>
                                <Link href={`/app/sprint/${session.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                </Link>
                               </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete the pending sprint. This action cannot be undone.
                                        </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteSession(session.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <Button asChild size="sm">
                                    <Link href={`/app/sprint/${session.id}`}>Confirm</Link>
                                </Button>
                            </>
                        )}
                        {(session.state !== 'Pending') && 
                            <Badge variant={session.state === 'Completed' ? 'default' : 'secondary'}>{session.state}</Badge>
                        }
                    </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
