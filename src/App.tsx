import { useState, useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentPhoneAuth } from './components/StudentPhoneAuth';
import { StudentVoting } from './components/StudentVoting';
import { VotingPage } from './components/VotingPage';

type UserType = 'admin' | 'student' | null;



function App() {
  const [userType, setUserType] = useState<UserType>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [studentPhone, setStudentPhone] = useState<string | null>(null);
  const createDemoElection = useMutation(api.demo.createDemoElection);

  useEffect(() => {
    // Check for existing admin auth
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAdminAuthenticated(true);
      setUserType('admin');
    }
    
    // Create demo election if it doesn't exist
    createDemoElection().catch(console.error);
  }, [createDemoElection]);

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    setUserType('admin');
  };

  const handleStudentLogin = (phoneNumber: string) => {
    setStudentPhone(phoneNumber);
    setUserType('student');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    setIsAdminAuthenticated(false);
    setStudentPhone(null);
    setUserType(null);
  };



  // User type selection screen
  if (userType === null) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="w-full p-4">
          <div className="h-10 w-10 bg-black text-white flex items-center justify-center text-sm font-bold rounded-lg">
            VC
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md text-center">
            <h1 className="text-4xl font-bold text-black mb-4">Vote Casted</h1>
            <p className="text-xl text-gray-600 mb-8">Choose your login type</p>
            
            <div className="space-y-4">
              <button
                onClick={() => setUserType('admin')}
                className="w-full px-6 py-4 bg-black text-white font-semibold hover:bg-gray-800 transition-colors rounded-lg"
              >
                Admin Login
              </button>
              
              <button
                onClick={() => setUserType('student')}
                className="w-full px-6 py-4 bg-white text-black border border-black font-semibold hover:bg-gray-50 transition-colors rounded-lg"
              >
                Student Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin flow
  if (userType === 'admin') {
    if (!isAdminAuthenticated) {
      return <AdminLogin onLogin={handleAdminLogin} onBack={() => setUserType(null)} />;
    }
    return <AdminDashboard />;
  }

  // Student flow - show demo election voting
  if (userType === 'student') {
    return <VotingPage />;
  }

  return null;
}

export default function AppWrapper() {
  return (
    <>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/vote/:electionId" element={<VotingPage />} />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}
