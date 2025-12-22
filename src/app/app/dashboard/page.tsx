'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser } from '@/lib/firebase/firestore';
import type { AssignmentGoal } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getAssignmentsForUser(user.uid)
        .then(setAssignments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="container mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <Button asChild>
          <Link href="/app/assignments/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Assignment
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-1/2 bg-muted rounded"></div>
              </CardContent>
              <CardFooter>
                 <div className="h-10 w-full bg-muted rounded"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
            </div>
            <CardTitle className="mt-4">No Assignments Yet</CardTitle>
            <CardDescription>Get started by creating your first assignment goal.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button asChild>
              <Link href="/app/assignments/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Assignment
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{assignment.title}</CardTitle>
                {assignment.optionalDeadline && (
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Clock className="h-4 w-4" />
                    Deadline: {format(assignment.optionalDeadline.toDate(), 'PPP')}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow">
                {/* Future content about sessions can go here */}
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/app/assignments/${assignment.id}`}>View Details</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
