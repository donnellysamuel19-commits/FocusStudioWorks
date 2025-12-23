'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth';
import { addStudySession, getStudySession, updateStudySession } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { StudySession } from '@/types';

const durationOptions = [10, 15, 20, 25] as const;

const formSchema = z.object({
  targetObject: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  nextAction: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  sprintDeliverable: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  durationMinutes: z.enum(["10", "15", "20", "25"]),
});

type FormValues = z.infer<typeof formSchema>;

// The params prop type needs to be optional for the 'new' route, but required for 'edit'.
type PageProps = {
    params: { id: string, sessionId?: string }
}

export default function NewOrEditSprintPage({ params }: PageProps) {
  const { id: assignmentId, sessionId } = params;
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setPageLoading] = useState(true);
  const isEditMode = !!sessionId;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetObject: '',
      nextAction: '',
      sprintDeliverable: '',
      durationMinutes: '15',
    },
  });

  useEffect(() => {
    if (isEditMode && sessionId && user) {
      getStudySession(sessionId).then(session => {
        if (session && session.userId === user?.uid) {
          form.reset({
            targetObject: session.targetObject,
            nextAction: session.nextAction,
            sprintDeliverable: session.sprintDeliverable,
            durationMinutes: String(session.durationMinutes) as "10" | "15" | "20" | "25",
          });
        } else {
           toast({ variant: "destructive", title: "Error", description: "Sprint not found." });
           router.push(`/app/assignments/${assignmentId}`);
        }
      }).finally(() => setPageLoading(false));
    } else {
      setPageLoading(false);
    }
  }, [isEditMode, sessionId, user, form, router, assignmentId, toast]);

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);

    const sessionData = {
      ...values,
      durationMinutes: parseInt(values.durationMinutes, 10) as StudySession['durationMinutes'],
    };

    try {
      if (isEditMode && sessionId) {
        await updateStudySession(sessionId, sessionData);
        toast({ title: 'Sprint Updated', description: 'Your changes have been saved.' });
      } else {
        await addStudySession(user.uid, assignmentId, sessionData);
        toast({ title: 'Sprint Defined', description: 'Your new sprint is ready to start.' });
      }
      router.push(`/app/assignments/${assignmentId}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: `Could not ${isEditMode ? 'update' : 'create'} sprint.` });
      setIsLoading(false);
    }
  }

  if (isPageLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">{isEditMode ? 'Edit Sprint' : 'Define Your Sprint'}</CardTitle>
          <CardDescription>
            {isEditMode ? 'Update the details of your pending sprint.' : 'Make a small, explicit commitment to start your study session.'}
          </CardDescription>
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
                    <FormDescription>What specific thing are you focusing on?</FormDescription>
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
                     <FormDescription>What is the very next physical action you will take?</FormDescription>
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
                    <FormDescription>What tangible thing will exist when you are done?</FormDescription>
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
                 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Save Changes' : 'Define Sprint'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    