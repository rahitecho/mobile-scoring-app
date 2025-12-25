/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OtpVerificationProps {
  phone: string;
  userExists: boolean;
  onVerified: (userData: any, needsRegistration: boolean) => void;
  onBack: () => void;
}

const OtpVerification = ({
  phone,
  userExists,
  onVerified,
  onBack,
}: OtpVerificationProps) => {
  const { verifyOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Timer for resend functionality
  useEffect(() => {
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Call the dupr-service OTP verification endpoint
      const { user, needsRegistration } = await verifyOtp(
        phone,
        otp,
        'fromLogin'
      );

      onVerified(user, needsRegistration);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      setError(error.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsResending(true);
      setError('');

      const response = await fetch(
        `${
          import.meta.env.VITE_DUPR_SERVICE_URL || 'http://localhost:3001'
        }/api/otp/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to resend OTP');
      }

      // Reset timer
      setCanResend(false);
      setResendTimer(60);
    } catch (error: any) {
      setError(error.message || 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className='container max-w-md mx-auto px-4 py-12'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Verify Your Number
      </h1>

      <Card>
        <CardHeader className='text-center'>
          <div className='mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4'>
            <MessageSquare className='w-6 h-6 text-primary' />
          </div>
          <CardTitle>Enter Verification Code</CardTitle>
          <CardDescription>
            We sent a 6-digit code to your WhatsApp
            <br />
            <span className='font-semibold'>{phone}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='space-y-6'>
            <div className='space-y-2'>
              <label className='sr-only'>OTP Code</label>
              <div className='flex gap-3 justify-center'>
                {Array.from({ length: 6 }).map((_, index) => (
                  <Input
                    key={index}
                    type='number'
                    value={otp[index] || ''}
                    onChange={(e) => {
                      const digit = e.target.value.replace(/\D/g, '').slice(-1);
                      const newOtp = otp.split('');
                      newOtp[index] = digit;
                      const updatedOtp = newOtp.join('').slice(0, 6);
                      setOtp(updatedOtp);

                      // Auto-focus next input
                      if (digit && index < 5) {
                        const nextInput = document.querySelector(
                          `input[data-index="${index + 1}"]`
                        ) as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      // Handle backspace to move to previous input
                      if (e.key === 'Backspace' && !otp[index] && index > 0) {
                        const prevInput = document.querySelector(
                          `input[data-index="${index - 1}"]`
                        ) as HTMLInputElement;
                        prevInput?.focus();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedData = e.clipboardData
                        .getData('text')
                        .replace(/\D/g, '')
                        .slice(0, 6);
                      setOtp(pastedData);
                    }}
                    maxLength={1}
                    className='w-12 h-12 text-center text-lg font-mono border-2 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                    disabled={isLoading}
                    data-index={index}
                  />
                ))}
              </div>
            </div>

            <Button
              type='button'
              className='w-full'
              disabled={isLoading || otp.length !== 6}
              onClick={handleVerifyOtp}
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>

          <div className='text-center space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Didn't receive the code?
            </p>

            {canResend ? (
              <Button
                variant='outline'
                onClick={handleResendOtp}
                disabled={isResending}
                className='w-full'
              >
                {isResending ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>
            ) : (
              <p className='text-sm text-muted-foreground'>
                Resend OTP in {resendTimer}s
              </p>
            )}

            <Button variant='ghost' onClick={onBack} className='w-full'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Change Phone Number
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OtpVerification;
