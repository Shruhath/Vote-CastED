import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { toast } from 'sonner';

interface StudentPhoneAuthProps {
  electionId: string;
  onLogin: (phoneNumber: string) => void;
  electionName?: string;
  className?: string;
}

export function StudentPhoneAuth({ electionId, onLogin, electionName, className }: StudentPhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Cleanup any existing recaptcha verifier on component mount
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
  }, []);

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          (window as any).recaptchaVerifier = null;
        }
      });
    }
    return (window as any).recaptchaVerifier;
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setIsLoading(true);

    try {
      const appVerifier = setupRecaptcha();
      
      // Format phone number
      let formattedPhone = phoneNumber.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `+91${formattedPhone}`;
      } else if (formattedPhone.length === 12 && formattedPhone.startsWith('91')) {
        formattedPhone = `+${formattedPhone}`;
      } else if (!formattedPhone.startsWith('+91')) {
        formattedPhone = `+91${formattedPhone.slice(-10)}`;
      }
      
      console.log('Sending OTP to:', formattedPhone);
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setIsOtpSent(true);
      toast.success('OTP sent successfully to your phone');
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please enter a valid 10-digit number.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
        // Reset reCAPTCHA
        if ((window as any).recaptchaVerifier) {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmationResult) {
      toast.error('Please request OTP first');
      return;
    }

    if (!otp.trim() || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      
      // Get the phone number from the Firebase user
      const firebaseUser = result.user;
      const userPhoneNumber = firebaseUser.phoneNumber;
      
      if (!userPhoneNumber) {
        throw new Error('Phone number not found in Firebase user');
      }
      
      console.log('Firebase user authenticated:', userPhoneNumber);
      
      // Pass the Firebase-verified phone number to the parent
      onLogin(userPhoneNumber);
      toast.success('Phone number verified successfully!');
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      
      let errorMessage = 'Invalid OTP. Please try again.';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsOtpSent(false);
    setOtp('');
    setConfirmationResult(null);
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
      (window as any).recaptchaVerifier = null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 border-b border-gray-200 px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-lg font-bold mx-auto rounded-lg mb-4">
              VC
            </div>
            <h1 className="text-2xl font-bold text-black">Vote Casted</h1>
            <p className="text-gray-600 mt-1">Student Voting Portal</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Election Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-black mb-2">
              {electionName || 'Election'}
            </h2>
            {className && (
              <p className="text-gray-600 text-sm">Class: {className}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">Election ID: {electionId}</p>
          </div>

          {/* Auth Form */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-black mb-2">Verify Your Phone</h3>
              <p className="text-gray-600 text-sm">
                {isOtpSent 
                  ? 'Enter the 6-digit OTP sent to your phone' 
                  : 'Enter your registered phone number to receive OTP'
                }
              </p>
            </div>

            {!isOtpSent ? (
              <form onSubmit={sendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="Enter your 10-digit phone number"
                    maxLength={10}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter without country code (e.g., 9876543210)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending OTP...</span>
                    </div>
                  ) : (
                    'Send OTP'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-black mb-2">
                    Enter OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-center text-lg tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    OTP sent to +91{phoneNumber.replace(/\D/g, '').slice(-10)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full px-4 py-3 bg-black text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full px-4 py-3 bg-white text-black border border-gray-300 font-medium hover:bg-gray-50 transition-colors rounded-lg"
                >
                  Change Phone Number
                </button>
              </form>
            )}

            <div id="recaptcha-container" className="invisible"></div>
          </div>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-xs text-gray-500">
              Having trouble? Make sure you're using the phone number registered for this election.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
