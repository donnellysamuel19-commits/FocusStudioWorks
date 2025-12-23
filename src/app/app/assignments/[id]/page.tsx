'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignment, getSessionsForAssignment, deleteStudySession } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, PlusCircle, CheckCircle, XCircle, PlayCircle, Hourglass, MoreVertical, Edit, Trash2, Info } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


export default function AssignmentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentGoal | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssignmentData = useCallback(() => {
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
            setAssignment(null);
            setSessions([]);
            toast({ variant: 'destructive', title: 'Error', description: 'Assignment not found or you don\'t have permission.' });
            router.push('/app/dashboard');
        }
      }).catch(err => {
        console.error(err);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load assignment data.' });
      }).finally(() => setLoading(false));
    }
  }, [user, params.id, toast, router]);

  useEffect(() => {
    fetchAssignmentData();
  }, [fetchAssignmentData]);

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteStudySession(sessionToDelete);
      toast({ title: 'Success', description: 'Sprint has been deleted.' });
      setSessionToDelete(null);
      fetchAssignmentData(); // Refresh data
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete the sprint.' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto">
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
    return null; // or a more specific "not found" component
  }

  const getStatusIcon = (status: StudySession['state']) => {
    switch(status) {
        case 'Completed': return <CheckCircle className="text-green-500" />;
        case 'Abandoned': return <XCircle className="text-red-500" />;
        case 'Active': return <PlayCircle className="text-blue-500 animate-pulse" />;
        case 'Pending': return <Hourglass className="text-yellow-500" />;
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
          <p className="text-muted-foreground col-span-1">Duration</p>
          <p className="col-span-2">{session.durationMinutes} minutes</p>
        </div>
         <div className="grid grid-cols-3 gap-2">
          <p className="text-muted-foreground col-span-1">Next Action</p>
          <p className="col-span-2">{session.nextAction}</p>
        </div>
         <div className="grid grid-cols-3 gap-2">
          <p className="text-muted-foreground col-span-1">Deliverable</p>
          <p className="col-span-2">{session.sprintDeliverable}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <p className="text-muted-foreground col-span-1">Status</p>
          <p className="col-span-2">
            <Badge variant={getStatusBadgeVariant(session.state)}>{session.state}</Badge>
          </p>
        </div>
        {session.startTime && (
           <div className="grid grid-cols-3 gap-2">
            <p className="text-muted-foreground col-span-1">Started</p>
            <p className="col-span-2">{format(session.startTime.toDate(), 'PPpp')}</p>
          </div>
        )}
        {session.endTime && (
          <div className="grid grid-cols-3 gap-2">
            <p className="text-muted-foreground col-span-1">Ended</p>
            <p className="col-span-2">{format(session.endTime.toDate(), 'PPpp')}</p>
          </div>
        )}
        {session.outcome && (
          <div className="grid grid-cols-3 gap-2">
            <p className="text-muted-foreground col-span-1">Outcome</p>
            <p className="col-span-2">{session.outcome}</p>
          </div>
        )}
        {session.optionalBlockerNote && (
          <div className="grid grid-cols-3 gap-2">
            <p className="text-muted-foreground col-span-1">Blocker</p>
            <p className="col-span-2 text-destructive/80">{session.optionalBlockerNote}</p>
          </div>
        )}
      </div>
    </DialogContent>
  );

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
                <div key={session.id} className="border p-4 rounded-lg flex items-center justify-between gap-4">
                    <div className='flex items-center gap-4 flex-1 min-w-0'>
                        <div className='hidden sm:block'>
                           {getStatusIcon(session.state)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className='font-semibold truncate' title={session.targetObject}>{session.targetObject}</p>
                            <p className='text-sm text-muted-foreground'>
                                {formatDistanceToNow(session.createdAt.toDate(), { addSuffix: true })} • {session.durationMinutes} min
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {session.state === 'Pending' && (
                             <Button asChild size="sm">
                                <Link href={`/app/sprint/${session.id}`}>
                                    <PlayCircle className="mr-2 h-4 w-4"/>
                                    Start
                                </Link>
                            </Button>
                        )}
                        {session.state === 'Active' && (
                             <Button asChild size="sm" variant="secondary">
                                <Link href={`/app/sprint/${session.id}/active`}>
                                    <PlayCircle className="mr-2 h-4 w-4"/>
                                    Resume
                                </Link>
                            </Button>
                        )}

                        <Dialog>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DialogTrigger asChild>
                                  <DropdownMenuItem>
                                    <Info className="mr-2 h-4 w-4" />
                                    <span>Details</span>
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                {session.state === 'Pending' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => router.push(`/app/assignments/${assignment.id}/sprint/edit/${session.id}`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-red-600" onSelect={() => setSessionToDelete(session.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            <span>Delete</span>
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  </>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <SessionDetailDialog session={session} />
                        </Dialog>
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
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSession} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
