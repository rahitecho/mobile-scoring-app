import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneLogin from '@/components/auth/PhoneLogin';
import OtpVerification from '@/components/auth/OtpVerification';
import RegistrationCompletion from '@/components/auth/RegistrationCompletion';
import { useAuth } from '@/contexts/AuthContext';

type AuthStep = 'phone' | 'otp' | 'registration' | 'complete';

interface AuthState {
  step: AuthStep;
  phone: string;
  userExists: boolean;
  userData: any;
  needsRegistration: boolean;
}

const LoginPage = () => {
  const { completeRegistration } = useAuth();
  const navigate = useNavigate();

  const [authState, setAuthState] = useState<AuthState>({
    step: 'phone',
    phone: '',
    userExists: false,
    userData: null,
    needsRegistration: false,
  });

  const handleOtpSent = (phone: string, userExists: boolean) => {
    setAuthState({
      ...authState,
      step: 'otp',
      phone,
      userExists,
    });
  };

  const handleOtpVerified = async (
    userData: any,
    needsRegistration: boolean
  ) => {
    if (needsRegistration) {
      setAuthState({
        ...authState,
        step: 'registration',
        userData,
        needsRegistration,
      });
    } else {
      // User is complete, navigate to leagues selection
      navigate('/');
    }
  };

  const handleRegistrationCompleted = async (userData: any): Promise<void> => {
    try {
      await completeRegistration(authState.phone, userData);

      // Navigate to leagues selection after successful registration
      navigate('/');
    } catch (error) {
      console.error('Error completing registration:', error);
      throw error; // Re-throw so the component knows there was an error
    }
  };

  const handleBackToPhone = () => {
    setAuthState({
      step: 'phone',
      phone: '',
      userExists: false,
      userData: null,
      needsRegistration: false,
    });
  };

  const renderStep = () => {
    switch (authState.step) {
      case 'phone':
        return <PhoneLogin onOtpSent={handleOtpSent} />;

      case 'otp':
        return (
          <OtpVerification
            phone={authState.phone}
            userExists={authState.userExists}
            onVerified={handleOtpVerified}
            onBack={handleBackToPhone}
          />
        );

      case 'registration':
        return (
          <RegistrationCompletion
            phone={authState.phone}
            userData={authState.userData}
            onCompleted={handleRegistrationCompleted}
            skipRegistrationCall={true}
          />
        );

      default:
        return <PhoneLogin onOtpSent={handleOtpSent} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {renderStep()}
    </div>
  );
};

export default LoginPage;