'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser, getAllSessionsForUser } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Target, Rocket, Calendar } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from '@/components/ui/separator';

export default function HistoryPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentGoal[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        getAssignmentsForUser(user.uid),
        getAllSessionsForUser(user.uid),
      ])
        .then(([assignmentsData, sessionsData]) => {
          setAssignments(assignmentsData);
          setSessions(sessionsData.filter(s => s.state === 'Completed' || s.state === 'Abandoned'));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);
  
  if (loading) {
    return (
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold font-headline mb-8">Session History</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  const sessionsByAssignment = assignments.map(assignment => ({
      ...assignment,
      sessions: sessions.filter(s => s.assignmentId === assignment.id)
  })).filter(a => a.sessions.length > 0);

  const SessionDetailsDialog = ({ session }: { session: StudySession }) => (
    <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sprint Details</DialogTitle>
          <DialogDescription>
            A read-only summary of your completed sprint.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
                {session.state === 'Completed' ? <CheckCircle className="text-green-500 h-5 w-5" /> : <XCircle className="text-red-500 h-5 w-5" />}
                <p className="font-semibold text-lg">{session.targetObject}</p>
                <Badge variant={session.state === 'Completed' ? 'default' : 'destructive'} className="ml-auto">{session.state}</Badge>
            </div>
            <Separator/>
            <div className="grid gap-4">
                <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-primary mt-1" />
                    <div>
                        <p className="font-semibold">Next Action</p>
                        <p className="text-sm text-muted-foreground">{session.nextAction}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Rocket className="h-5 w-5 text-primary mt-1" />
                    <div>
                        <p className="font-semibold">Deliverable</p>
                        <p className="text-sm text-muted-foreground">{session.sprintDeliverable}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                        <p className="font-semibold">Duration</p>
                        <p className="text-sm text-muted-foreground">{session.durationMinutes} minutes</p>
                    </div>
                </div>
                {session.endTime && (
                     <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-primary mt-1" />
                        <div>
                            <p className="font-semibold">Completed On</p>
                            <p className="text-sm text-muted-foreground">{format(session.endTime.toDate(), 'PPP p')}</p>
                        </div>
                    </div>
                )}
                 {session.optionalBlockerNote && (
                    <div className="p-3 border-l-4 border-destructive bg-destructive/10 rounded">
                        <p className="font-semibold text-destructive">Blocker Note</p>
                        <p className="text-sm text-destructive/80">{session.optionalBlockerNote}</p>
                    </div>
                 )}
            </div>
        </div>
      </DialogContent>
  );

  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-bold font-headline mb-8">Session History</h1>
      
      {sessionsByAssignment.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <CardTitle>No Completed Sprints</CardTitle>
            <CardDescription>Your completed study sprints will appear here.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Accordion type="multiple" className="w-full space-y-4">
            {sessionsByAssignment.map(assignment => (
                <AccordionItem key={assignment.id} value={assignment.id} className="border rounded-lg bg-card">
                    <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                       {assignment.title}
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                        <div className="space-y-4">
                            {assignment.sessions.map(session => (
                                <Dialog key={session.id}>
                                    <DialogTrigger asChild>
                                        <div className="border p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors">
                                            <div className='flex items-center gap-4'>
                                                <div>
                                                    {session.state === 'Completed' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                                                </div>
                                                <div>
                                                    <p className='font-semibold'>{session.targetObject}</p>
                                                    <p className='text-sm text-muted-foreground'>
                                                        {formatDistanceToNow(session.createdAt.toDate(), { addSuffix: true })} • {session.durationMinutes} min sprint
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={session.state === 'Completed' ? 'default' : 'destructive'}>{session.state}</Badge>
                                        </div>
                                    </DialogTrigger>
                                    <SessionDetailsDialog session={session} />
                                </Dialog>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      )}
    </div>
  );
}
