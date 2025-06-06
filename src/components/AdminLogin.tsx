import { useState } from 'react';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple password check - in production, use proper authentication
    if (password === 'admin123') {
      localStorage.setItem('adminAuth', 'true');
      toast.success('Login successful!');
      onLogin();
    } else {
      toast.error('Invalid password');
    }
    
    setIsLoading(false);
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
            <h1 className="text-2xl font-bold text-black">Admin Login</h1>
            <p className="text-gray-600 mt-1">Enter your admin password</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                  Admin Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                  placeholder="Enter admin password"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Demo password: admin123
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
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Login'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
