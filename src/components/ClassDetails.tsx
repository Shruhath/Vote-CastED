import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ClassDetailsProps {
  classId: string;
  onBack: () => void;
}

export function ClassDetails({ classId, onBack }: ClassDetailsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'candidates'>('all');
  const students = useQuery(api.students.getStudentsByClass, { classId });
  const candidates = useQuery(api.students.getCandidatesByClass, { classId });
  const toggleCandidate = useMutation(api.students.toggleCandidate);

  const handleToggleCandidate = async (student: Doc<"students">) => {
    try {
      await toggleCandidate({
        studentId: student._id,
        isCandidate: !student.isCandidate,
      });
      toast.success(
        student.isCandidate 
          ? `${student.name} removed as candidate`
          : `${student.name} added as candidate`
      );
    } catch (error) {
      toast.error("Failed to update candidate status");
    }
  };

  const formatClassDisplay = (classId: string) => {
    const parts = classId.split('.');
    if (parts.length !== 3) return classId;
    
    const [campus, stream, programInfo] = parts;
    const programType = programInfo[0];
    const programLength = programInfo[1];
    const branch = programInfo.substring(2, 5);
    const year = programInfo.substring(5, 7);
    const section = parseInt(programInfo.substring(7, 8));
    const sectionLetter = String.fromCharCode(65 + section);
    
    return `${campus.toUpperCase()}.${stream.toUpperCase()}.${programType.toUpperCase()}${programLength}${branch.toUpperCase()}${year}${sectionLetter}`;
  };

  if (students === undefined) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
      </div>
    );
  }

  const displayStudents = activeTab === 'candidates' ? (candidates || []) : students;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-black hover:text-gray-600 mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Classes
          </button>
          <h1 className="text-2xl font-bold text-black">
            Class {formatClassDisplay(classId)}
          </h1>
          <p className="text-gray-600">
            {students.length} students • {candidates?.length || 0} candidates
          </p>
        </div>
        
        <button className="bg-black text-white px-4 py-2 hover:bg-gray-800 transition-colors">
          Start Election
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'candidates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Candidates ({candidates?.length || 0})
          </button>
        </nav>
      </div>

      {/* Student List */}
      <div className="bg-white border border-black">
        {displayStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">
              {activeTab === 'candidates' ? 'No candidates selected' : 'No students found'}
            </div>
            <div className="text-sm text-gray-400">
              {activeTab === 'candidates' 
                ? 'Toggle students as candidates to see them here'
                : 'Upload student data to see students here'
              }
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roll Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-black">{student.name}</div>
                        <div className="text-sm text-gray-500">{student.gender}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {student.rollNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {student.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {student.isCandidate && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Candidate
                          </span>
                        )}
                        {student.hasVoted && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Voted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggleCandidate(student)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          student.isCandidate
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {student.isCandidate ? 'Remove Candidate' : 'Make Candidate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
