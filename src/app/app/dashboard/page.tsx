'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { getAssignmentsForUser, deleteAssignment } from '@/lib/firebase/firestore';
import type { AssignmentGoal } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { PlusCircle, BookOpen, Clock, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, isDevBypass } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<AssignmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAssignments = useCallback(() => {
    if (user) {
      setLoading(true);
      getAssignmentsForUser(user.uid)
        .then(setAssignments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async () => {
    if (!assignmentToDelete || !user) return;
    setIsDeleting(true);
    try {
      await deleteAssignment(assignmentToDelete, user.uid);
      toast({ title: 'Success', description: 'Assignment deleted successfully.' });
      fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      const description = error?.message ? String(error.message) : 'Could not delete the assignment. Check database security rules.';
      toast({ 
        variant: 'destructive', 
        title: 'Deletion Failed', 
        description: description
      });
    } finally {
      setIsDeleting(false);
      setAssignmentToDelete(null);
    }
  };

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
              <CardHeader><div className="h-6 w-3/4 bg-muted rounded"></div></CardHeader>
              <CardContent><div className="h-4 w-1/2 bg-muted rounded"></div></CardContent>
              <CardFooter><div className="h-10 w-full bg-muted rounded"></div></CardFooter>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card className="text-center py-12">
           <CardHeader>
            <div className="mx-auto bg-secondary rounded-full p-3 w-fit"><BookOpen className="h-12 w-12 text-muted-foreground" /></div>
            <CardTitle className="mt-4">No Assignments Yet</CardTitle>
            <CardDescription>Get started by creating your first assignment goal.</CardDescription>
            {isDevBypass && <p className="text-xs text-muted-foreground mt-4">No assignments for UID: {user?.uid}</p>}
          </CardHeader>
          <CardContent>
             <Button asChild><Link href="/app/assignments/new"><PlusCircle className="mr-2 h-4 w-4" />Create Assignment</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assignments.map((assignment) => (
            <Card key={assignment.id} className="flex flex-col">
              <CardHeader className="relative">
                <CardTitle>{assignment.title}</CardTitle>
                {assignment.optionalDeadline && (
                  <CardDescription className="flex items-center gap-2 pt-1">
                    <Clock className="h-4 w-4" />
                    Deadline: {format(assignment.optionalDeadline.toDate(), 'PPP')}
                  </CardDescription>
                )}
                <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => setAssignmentToDelete(assignment.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow" />
              <CardFooter>
                <Button asChild className="w-full"><Link href={`/app/assignments/${assignment.id}`}>View Details</Link></Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!assignmentToDelete} onOpenChange={(open) => !open && setAssignmentToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This will permanently delete the assignment and all its study sessions. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setAssignmentToDelete(null)} disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                    {isDeleting ? 'Deleting...' : 'Confirm'}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
