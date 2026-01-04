'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser, getAllSessionsForUser } from '@/lib/firebase/firestore';
import type { AssignmentGoal, StudySession } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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

  const sessionsByAssignment = useMemo(() => {
    return assignments
      .map(assignment => ({
        ...assignment,
        sessions: sessions
          .filter(s => s.assignmentId === assignment.id)
          .sort((a, b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0)),
      }))
      .filter(a => a.sessions.length > 0)
      .sort((a,b) => (b.createdAt?.toDate().getTime() || 0) - (a.createdAt?.toDate().getTime() || 0));
  }, [assignments, sessions]);

  const getStatusBadge = (status: StudySession['state']) => {
    switch (status) {
      case 'Completed': return <Badge className="bg-green-500/20 text-green-300 border-green-500/30">Completed</Badge>;
      case 'Abandoned': return <Badge variant="destructive">Abandoned</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="h-full text-white">
      <h1 className="text-3xl font-bold mb-8">Session History</h1>
      
      {sessionsByAssignment.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full bg-gray-800 rounded-lg">
            <p className="text-xl font-semibold">No History Found</p>
            <p className="text-gray-400 mt-2">Your completed and abandoned sprints will appear here.</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={sessionsByAssignment.map(a => a.id)} className="w-full space-y-4">
            {sessionsByAssignment.map(assignment => (
                <AccordionItem key={assignment.id} value={assignment.id} className="bg-gray-800 border-none rounded-lg">
                    <AccordionTrigger className="p-4 text-lg font-semibold hover:no-underline">
                       {assignment.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                            {assignment.sessions.map(session => (
                                <Link key={session.id} href={`/sprint/${session.id}/details`}>
                                    <div className="bg-gray-900 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-800/60 border border-gray-700/60">
                                        <div className='flex items-center gap-4'>
                                            <div>
                                                {session.state === 'Completed' ? <CheckCircle className="text-green-500" /> : <XCircle className="text-red-500" />}
                                            </div>
                                            <div>
                                                <p className='font-semibold'>{session.targetObject}</p>
                                                <p className='text-sm text-gray-400'>
                                                    {session.createdAt ? format(session.createdAt.toDate(), 'MMMM do, yyyy') : ''} • {session.durationMinutes} min sprint
                                                </p>
                                                 {session.state === 'Abandoned' && session.abandonReason && (
                                                    <p className="text-xs text-red-400 mt-1">Blocker: {session.abandonReason}</p>
                                                 )}
                                            </div>
                                        </div>
                                        {getStatusBadge(session.state)}
                                    </div>
                                </Link>
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
