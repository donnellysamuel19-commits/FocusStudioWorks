'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getStudySession } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CheckCircle, Award } from 'lucide-react';
import Link from 'next/link';

export default function SprintSummaryPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && sessionId) {
      getStudySession(sessionId)
        .then(sessionData => {
          if (sessionData && sessionData.userId === user.uid) {
            setSession(sessionData);
          } else {
            router.replace('/dashboard');
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, sessionId, router]);

  if (loading || !session) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <Card className="bg-gray-800 border-gray-700 text-center max-w-lg">
            <CardHeader>
                <div className="mx-auto bg-green-500 rounded-full h-16 w-16 flex items-center justify-center">
                    <Award className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold mt-4">Sprint Complete!</CardTitle>
                <CardDescription className="text-gray-400">Congratulations on finishing your study sprint.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="text-left space-y-4">
                    <div>
                        <p className="font-semibold text-lg">Target Object</p>
                        <p className="text-gray-300">{session.targetObject}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Deliverable</p>
                        <p className="text-gray-300">{session.sprintDeliverable}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Duration</p>
                        <p className="text-gray-300">{session.durationMinutes} minutes</p>
                    </div>
                </div>
                <div className="flex gap-4 mt-6">
                    <Link href="/dashboard" className="flex-1">
                        <Button variant="secondary" className="w-full bg-gray-700 hover:bg-gray-600">Go to Dashboard</Button>
                    </Link>
                    <Link href={`/assignments/${session.assignmentId}`} className="flex-1">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Back to Assignment</Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
