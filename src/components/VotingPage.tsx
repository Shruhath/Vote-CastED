import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { StudentPhoneAuth } from './StudentPhoneAuth';
import { StudentVoting } from './StudentVoting';

export function VotingPage() {
  const { electionId } = useParams<{ electionId: string }>();
  const [studentPhone, setStudentPhone] = useState<string | null>(null);

  if (!electionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Invalid Election Link</h1>
          <p className="text-gray-600">The election ID is missing from the URL.</p>
        </div>
      </div>
    );
  }

  if (!studentPhone) {
    return (
      <StudentPhoneAuth 
        electionId={electionId}
        onLogin={setStudentPhone}
      />
    );
  }

  return (
    <StudentVoting 
      electionId={electionId}
      phoneNumber={studentPhone} 
      onLogout={() => setStudentPhone(null)} 
    />
  );
}