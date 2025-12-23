
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { getStudySession, updateStudySession } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { StudySession } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const durationOptions = [10, 15, 20, 25] as const;

const formSchema = z.object({
  targetObject: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  nextAction: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  sprintDeliverable: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  durationMinutes: z.enum(["10", "15", "20", "25"]),
});

export default function EditSprintPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<StudySession | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const sessionId = params.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetObject: '',
      nextAction: '',
      sprintDeliverable: '',
      durationMinutes: '15',
    },
  });
  
  useEffect(() => {
    if (user && sessionId) {
      setLoadingSession(true);
      getStudySession(sessionId)
        .then(sessionData => {
          if (sessionData && sessionData.userId === user.uid && sessionData.state === 'Pending') {
            setSession(sessionData);
            form.reset({
                ...sessionData,
                durationMinutes: String(sessionData.durationMinutes) as "10" | "15" | "20" | "25"
            });
          } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Sprint not found or cannot be edited.' });
            router.replace('/app/dashboard');
          }
        })
        .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Could not load sprint data.'}))
        .finally(() => setLoadingSession(false));
    }
  }, [user, sessionId, router, form, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !session) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);
    try {
      await updateStudySession(session.id, {
        ...values,
        durationMinutes: parseInt(values.durationMinutes, 10) as (10|15|20|25),
      });
      toast({ title: 'Sprint Updated', description: 'Your changes have been saved.' });
      router.push(`/app/assignments/${session.assignmentId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not update sprint.' });
      setIsLoading(false);
    }
  }

  if (loadingSession) {
      return (
           <div className="container mx-auto max-w-2xl">
              <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
              </Card>
           </div>
      )
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Edit Your Sprint</CardTitle>
          <CardDescription>Update the details of your pending study session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="targetObject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Object</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Chapter 3, Section 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nextAction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Action</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Read pages 45-50 and highlight key terms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sprintDeliverable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sprint Deliverable</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A list of 10 key terms" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="durationMinutes"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Sprint Duration</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {durationOptions.map(duration => (
                           <FormItem key={duration} className="flex items-center space-x-3 space-y-0">
                             <FormControl>
                               <RadioGroupItem value={String(duration)} />
                             </FormControl>
                             <FormLabel className="font-normal">{duration} minutes</FormLabel>
                           </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                 <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
