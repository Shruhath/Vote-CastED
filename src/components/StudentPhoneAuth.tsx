import { useState } from 'react';
import { toast } from 'sonner';

interface StudentPhoneAuthProps {
  onAuthenticated: (phoneNumber: string) => void;
  onBack: () => void;
  electionId: string;
  electionName: string;
}

export function StudentPhoneAuth({ onAuthenticated, onBack, electionId, electionName }: StudentPhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    // Basic phone number validation
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);

    try {
      // Format phone number
      const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : 
                            cleanPhone.startsWith('91') ? `+${cleanPhone}` : 
                            `+91${cleanPhone.slice(-10)}`;

      // For demo purposes, we'll skip OTP verification
      // In a real app, you would send OTP here and verify it
      
      toast.success('Phone number verified successfully!');
      onAuthenticated(formattedPhone);
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-md mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-black mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <div className="text-center">
            <div className="h-12 w-12 bg-black text-white flex items-center justify-center text-lg font-bold mx-auto rounded-lg mb-4">
              VC
            </div>
            <h1 className="text-2xl font-bold text-black">Student Login</h1>
            <p className="text-gray-600 mt-1">{electionName}</p>
            <p className="text-sm text-gray-500 mt-1">Election ID: {electionId}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-black mb-2">Enter Your Phone Number</h2>
              <p className="text-sm text-gray-600">
                Please enter the phone number you registered with for this election.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-black mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">+91</span>
                  </div>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    placeholder="9876543210"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your 10-digit mobile number without country code
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
                    <span>Verifying...</span>
                  </div>
                ) : (
                  'Continue to Vote'
                )}
              </button>
            </form>

            {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Demo Numbers:</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>• +919876543210 (Alice Johnson)</p>
                <p>• +919876543211 (Bob Smith)</p>
                <p>• +919876543212 (Charlie Brown)</p>
                <p>• +919876543213 (Diana Prince)</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
