'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser, getAllSessionsForUser } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function HistoryPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentGoal[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
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
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  const sessionsByAssignment = assignments.map(assignment => ({
      ...assignment,
      sessions: sessions.filter(s => s.assignmentId === assignment.id)
  })).filter(a => a.sessions.length > 0);

  const getStatusBadgeVariant = (status: StudySession['state']) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'Abandoned': return 'destructive';
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
      <div className="space-y-4 text-sm pt-4">
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
          <div className="text-muted-foreground col-span-1">Status</div>
          <div className="col-span-2">
            <Badge variant={getStatusBadgeVariant(session.state)}>{session.state}</Badge>
          </div>
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
            <p className="text-muted-foreground col-span-1">Blocker Note</p>
            <p className="col-span-2 text-destructive/80">{session.optionalBlockerNote}</p>
          </div>
        )}
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
                                    <div className="border p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-accent">
                                        <div className='flex items-center gap-4'>
                                            <div>
                                                {session.state === 'Completed' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                                            </div>
                                            <div>
                                                <p className='font-semibold'>{session.targetObject}</p>
                                                <p className='text-sm text-muted-foreground'>
                                                    {format(session.createdAt.toDate(), 'PPP')} • {session.durationMinutes} min sprint
                                                </p>
                                                 {session.optionalBlockerNote && (
                                                    <p className="text-xs text-destructive/80 mt-1 truncate">Blocker: {session.optionalBlockerNote}</p>
                                                 )}
                                            </div>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(session.state)}>{session.state}</Badge>
                                    </div>
                                  </DialogTrigger>
                                  <SessionDetailDialog session={session} />
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
