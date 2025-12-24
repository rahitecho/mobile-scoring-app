import { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone number must be exactly 10 digits')
    .min(10, 'Phone number must be 10 digits')
    .max(10, 'Phone number must be 10 digits'),
});

type FormData = z.infer<typeof formSchema>;

interface PhoneLoginProps {
  onOtpSent: (phone: string, userExists: boolean) => void;
}

const PhoneLogin = ({ onOtpSent }: PhoneLoginProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+91');
  const { signInWithPhone } = useAuth();

  const countries = [
    { code: '+91', flag: '🇮🇳', name: 'India' },
    { code: '+1', flag: '🇺🇸', name: 'USA' },
    { code: '+44', flag: '🇬🇧', name: 'UK' },
    { code: '+61', flag: '🇦🇺', name: 'Australia' },
    { code: '+81', flag: '🇯🇵', name: 'Japan' },
  ];

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);

      // Call the dupr-service OTP generation endpoint
      const result = await signInWithPhone(`${countryCode}${data.phone}`);

      // Call the callback with phone number and user existence status
      onOtpSent(`${countryCode}${data.phone}`, result.userExists);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      alert(`Failed to Send OTP: ${error.message || 'Please try again later'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='container max-w-md mx-auto px-4 py-12'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Login with WhatsApp
      </h1>

      <Card>
        <CardHeader className='text-center'>
          <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
            <Smartphone className='w-6 h-6 text-primary' />
          </div>
          <CardTitle>Enter Your Phone Number</CardTitle>
          <CardDescription>
            We'll send you an OTP via WhatsApp to verify your number
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <div className='flex gap-2'>
                        <div className='relative'>
                          <Select
                            value={countryCode}
                            onValueChange={setCountryCode}
                          >
                            <SelectTrigger className='w-20 flex-shrink-0'>
                              <div className='flex items-center gap-1'>
                                <span className='text-lg'>{selectedCountry.flag}</span>
                                <span className='text-sm'>{selectedCountry.code}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className='z-50'>
                              {countries.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <div className='flex items-center gap-2'>
                                    <span className='text-lg'>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          type='tel'
                          placeholder='9876543210'
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            field.onChange(value);
                          }}
                          maxLength={10}
                          disabled={isLoading}
                          className='flex-1'
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP via WhatsApp'
                )}
              </Button>
            </form>
          </Form>

          <div className='mt-6 text-center'>
            <p className='text-sm text-muted-foreground'>
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoneLogin;