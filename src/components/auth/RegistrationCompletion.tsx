import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['player', 'umpire'], {
    required_error: 'Please select a role',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface RegistrationCompletionProps {
  phone: string;
  userData?: any;
  onCompleted: (userData: any) => Promise<void>;
  skipRegistrationCall?: boolean;
}

const RegistrationCompletion = ({
  phone,
  userData,
  onCompleted,
  skipRegistrationCall = false,
}: RegistrationCompletionProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { completeRegistration } = useAuth();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'player',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      if (skipRegistrationCall) {
        // For main login flow - wait for parent to complete the registration
        await onCompleted(data);
      } else {
        // Call the registration completion endpoint
        const response = await completeRegistration(phone, data);
        await onCompleted(response);
      }
    } catch (error: any) {
      console.error('Error completing registration:', error);
      alert(`Registration Failed: ${error.message || 'Please try again later'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container max-w-md mx-auto px-4 py-12'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Complete Your Profile
      </h1>

      <Card>
        <CardHeader className='text-center'>
          <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
            <User className='w-6 h-6 text-primary' />
          </div>
          <CardTitle>Almost There!</CardTitle>
          <CardDescription>
            Please provide some basic information to complete your registration
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter your full name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter your email address'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select your role' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='player'>Player</SelectItem>
                        <SelectItem value='umpire'>Umpire</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Completing Registration...
                  </>
                ) : (
                  'Complete Registration'
                )}
              </Button>
            </form>
          </Form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-muted-foreground'>Phone: {phone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegistrationCompletion;