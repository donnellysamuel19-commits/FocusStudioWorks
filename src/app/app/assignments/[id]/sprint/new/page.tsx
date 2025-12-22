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
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { addStudySession } from '@/lib/firebase/firestore';
import { Loader2 } from 'lucide-react';

const durationOptions = [10, 15, 20, 25] as const;

const formSchema = z.object({
  targetObject: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  nextAction: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  sprintDeliverable: z.string().min(3, { message: 'Must be at least 3 characters.' }).max(150),
  durationMinutes: z.enum(["10", "15", "20", "25"]),
});

export default function NewSprintPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const assignmentId = params.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targetObject: '',
      nextAction: '',
      sprintDeliverable: '',
      durationMinutes: '15',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    setIsLoading(true);
    try {
      const sessionId = await addStudySession(user.uid, assignmentId, {
        ...values,
        durationMinutes: parseInt(values.durationMinutes, 10) as (10|15|20|25),
      });
      toast({ title: 'Sprint Defined', description: 'Confirm your commitment to begin.' });
      router.push(`/app/sprint/${sessionId}`);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not create sprint.' });
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Define Your Sprint</CardTitle>
          <CardDescription>Make a small, explicit commitment to start your study session.</CardDescription>
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
                 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Define Sprint
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
