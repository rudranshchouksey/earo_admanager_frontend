import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, MessageSquare, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supportApi } from '@/services/support';
import { logger } from "@/lib/logger";


const TOPICS = [
  'Onboarding',
  'Login & Access',
  'Audio Ads',
  'Campaigns',
  'Billing & Payment',
  'Reporting',
  'Other',
];

const supportSchema = z.object({
  topic: z.string().nonempty({ message: 'Please select a topic' }),
  message: z
    .string()
    .trim()
    .nonempty({ message: 'Message is required' })
    .max(2000, { message: 'Message must be under 2000 characters' }),
});

interface SupportMessage {
  topic: string;
  message: string;
}

export default function Support() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setUserEmail(session?.user?.email ?? '');
    // });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = supportSchema.safeParse({ topic, message });
    if (!parsed.success) {
      toast({
        title: 'Please check the form',
        description: parsed.error.errors[0]?.message ?? 'Invalid input',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error, status, message } = await supportApi.sendSupport({ topic: parsed.data.topic, message: parsed.data.message } as SupportMessage);
      if (status != 200 || error) {
        logger.error('Send support error', { status, error, message });
        toast({
          title: message ?? 'Could not send message',
          description: error?.message ?? 'Please try again in a moment.',
          variant: 'destructive',
        });
        return;
      }else{
        toast({
          title: 'Message sent',
          description: 'We will get back to you shortly.',
          variant: 'default',
        });
        setSubmitted(true);
      }
    } catch (err: any) {
      logger.captureException(err, { context: "sendSupport" });
      toast({
        title: 'Could not send message',
        description: err?.message ?? 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1088px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">Contact Support</h1>
        <p className="text-sm text-muted-foreground">
          Tell us what you need help with and we typically reply within one business day.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-4">
          <Card className="bg-[#F5F5F7] border-0">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <a
                    href="mailto:help@earo.ai"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    help@earo.ai
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Support hours</p>
                  <p className="text-sm text-muted-foreground">Mon–Fri, 9:00–18:00 GST</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card>
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Message sent</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Thanks for reaching out — we'll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Select value={topic} onValueChange={setTopic}>
                      <SelectTrigger id="topic">
                        <SelectValue placeholder="Select a topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {TOPICS.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      maxLength={2000}
                      placeholder="Describe your issue or question…"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}