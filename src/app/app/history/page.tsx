'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser, getAllSessionsForUser } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

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
                                <div key={session.id} className="border p-4 rounded-lg flex items-center justify-between">
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
                                                <p className="text-xs text-destructive/80 mt-1">Blocker: {session.optionalBlockerNote}</p>
                                             )}
                                        </div>
                                    </div>
                                    <Badge variant={session.state === 'Completed' ? 'default' : 'destructive'}>{session.state}</Badge>
                                </div>
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
