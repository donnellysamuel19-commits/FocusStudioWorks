'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/lib/auth';
import { getStudySession } from '@/lib/firebase/firestore';
import type { StudySession } from '@/types';
import { Loader2, CheckCircle, XCircle, Bot, User, CornerDownRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SprintDetailsPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { user } = useAuth();
  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && sessionId) {
      getStudySession(sessionId)
        .then(sessionData => {
          if (sessionData && sessionData.userId === user.uid) {
            setSession(sessionData);
          } 
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, sessionId]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!session) {
    return <div className="text-center text-red-500">Session not found.</div>;
  }

  const getStatusIcon = (status: StudySession['state']) => {
    if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (status === 'Abandoned') return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  return (
    <div className="text-white max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Sprint Details</h1>
        <p className="text-gray-400">A detailed review of your study session from {session.createdAt?.toDate().toLocaleDateString()}</p>
      </header>

      <div className="space-y-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{session.targetObject}</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(session.state)}
                <Badge variant={session.state === 'Completed' ? 'default' : 'destructive'}>{session.state}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-gray-700 pb-2">Your Commitment</h3>
                <div className="flex items-start gap-4">
                    <User className="h-6 w-6 text-gray-400 mt-1" />
                    <div>
                        <p className="font-medium">Next Action</p>
                        <p className="text-gray-300">{session.nextAction}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <User className="h-6 w-6 text-gray-400 mt-1" />
                    <div>
                        <p className="font-medium">Deliverable</p>
                        <p className="text-gray-300">{session.sprintDeliverable}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b border-gray-700 pb-2">AI Suggestion</h3>
                {session.aiSuggestion ? (
                    <div className="flex items-start gap-4">
                        <Bot className="h-6 w-6 text-blue-400 mt-1" />
                        <div>
                             <p className="text-gray-300">{session.aiSuggestion}</p>
                             <div className="mt-3 flex items-center gap-3">
                                <CornerDownRight className={`h-5 w-5 ${session.usedAiSuggestion ? 'text-green-500' : 'text-red-500'}`} />
                                <span className={`text-sm font-medium ${session.usedAiSuggestion ? 'text-green-400' : 'text-red-400'}`}>
                                    {session.usedAiSuggestion ? 'Suggestion Adopted' : 'Suggestion Declined'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500 italic">No AI suggestion was provided for this sprint.</p>
                )}
            </div>
          </CardContent>
        </Card>

        {session.state === 'Abandoned' && session.abandonReason && (
             <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                    <CardTitle className="text-lg text-red-400">Abandonment Reason</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{session.abandonReason}</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
