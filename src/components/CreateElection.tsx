import { useState, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { toast } from 'sonner';

interface CreateElectionProps {
  onBack: () => void;
}

export function CreateElection({ onBack }: CreateElectionProps) {
  const [electionName, setElectionName] = useState('');
  const [className, setClassName] = useState('');
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [multiVote, setMultiVote] = useState(false);
  const [totalVotesPerVoter, setTotalVotesPerVoter] = useState(1);
  const [minVotesMale, setMinVotesMale] = useState(0);
  const [minVotesFemale, setMinVotesFemale] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const createElection = useMutation(api.elections.createElection);

  // Validation function for gender quota
  const validateGenderQuota = () => {
    if (multiVote) {
      const totalGenderVotes = minVotesMale + minVotesFemale;
      if (totalGenderVotes !== totalVotesPerVoter) {
        toast.error("Sum of male and female winners must equal total votes per voter.");
        return false;
      }
    }
    return true;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    if (!electionName || !className || !year || !branch || section === '' || !startDate || !endDate) {
      toast.error("Please fill in all election details before uploading student data");
      return;
    }

    // Validate gender quota before proceeding
    if (!validateGenderQuota()) {
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error("CSV file must contain at least a header row and one data row");
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
      
      // Find column indices - updated for email instead of phone
      const rollNumberIndex = headers.findIndex(h => 
        h.includes('roll') || h.includes('number') || h.includes('id')
      );
      const nameIndex = headers.findIndex(h => 
        h.includes('name') || h.includes('student')
      );
      const emailIndex = headers.findIndex(h => 
        h.includes('email') || h.includes('mail')
      );
      const genderIndex = headers.findIndex(h => 
        h.includes('gender') || h.includes('sex')
      );

      if (rollNumberIndex === -1) {
        toast.error("CSV must contain a 'Roll Number' or 'ID' column");
        return;
      }
      if (nameIndex === -1) {
        toast.error("CSV must contain a 'Name' column");
        return;
      }
      if (emailIndex === -1) {
        toast.error("CSV must contain an 'Email' column");
        return;
      }

      const studentsData = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV parsing with potential commas in quoted fields
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim().replace(/"/g, ''));
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim().replace(/"/g, ''));
        
        if (values.length <= Math.max(rollNumberIndex, nameIndex, emailIndex)) {
          errors.push(`Row ${i + 1}: Insufficient columns`);
          continue;
        }

        const rollNumber = values[rollNumberIndex]?.trim();
        const name = values[nameIndex]?.trim();
        const email = values[emailIndex]?.trim();
        const gender = genderIndex !== -1 ? values[genderIndex]?.trim() || 'Not specified' : 'Not specified';

        if (!rollNumber || !name || !email) {
          errors.push(`Row ${i + 1}: Missing required data (roll number, name, or email)`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }

        studentsData.push({
          rollNumber,
          name,
          email: email.toLowerCase(), // Normalize email to lowercase
          gender: gender === 'M' || gender === 'Male' || gender === 'MALE' ? 'Male' :
                  gender === 'F' || gender === 'Female' || gender === 'FEMALE' ? 'Female' : 
                  gender || 'Not specified',
        });
      }

      if (errors.length > 0 && studentsData.length === 0) {
        toast.error(`Failed to process any students. First error: ${errors[0]}`);
        return;
      }

      if (studentsData.length === 0) {
        toast.error("No valid student data found in file");
        return;
      }

      // Create election with the data
      const result = await createElection({
        electionName,
        className,
        year: parseInt(year),
        branch: branch.toLowerCase(),
        section: parseInt(section),
        startDate: new Date(startDate).getTime(),
        endDate: new Date(endDate).getTime(),
        studentsData,
        electionConfig: {
          multiVote,
          totalVotesPerVoter,
          minVotesPerGender: {
            Male: minVotesMale,
            Female: minVotesFemale
          }
        }
      });
      
      toast.success(
        `Election "${electionName}" created successfully! ` +
        `Processed ${result.studentsProcessed} students. ` +
        `${errors.length > 0 ? `Skipped ${errors.length} invalid rows.` : ''}`
      );

      // Reset form
      setElectionName('');
      setClassName('');
      setYear('');
      setBranch('');
      setSection('');
      setStartDate('');
      setEndDate('');
      setMultiVote(false);
      setTotalVotesPerVoter(1);
      setMinVotesMale(0);
      setMinVotesFemale(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Go back to dashboard after successful creation
      setTimeout(() => onBack(), 2000);

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to create election: ${error.message || 'Please check the file format and try again'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const branches = [
    { value: 'cse', label: 'Computer Science (CSE)' },
    { value: 'ece', label: 'Electronics & Communication (ECE)' },
    { value: 'eee', label: 'Electrical & Electronics (EEE)' },
    { value: 'mech', label: 'Mechanical (MECH)' },
    { value: 'civil', label: 'Civil (CIVIL)' },
    { value: 'it', label: 'Information Technology (IT)' },
    { value: 'aids', label: 'AI & Data Science (AIDS)' },
    { value: 'csbs', label: 'Computer Science & Business Systems (CSBS)' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/90 border-b border-gray-200 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center text-black hover:text-gray-500 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black">Create New Election</h1>
            <p className="text-gray-700 mt-1">Set up a new class representative election</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/90 rounded-lg border border-gray-200 p-8">
            <div className="space-y-8">
              {/* Basic Election Details */}
              <div>
                <h2 className="text-xl font-semibold text-black mb-6">Election Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="electionName" className="block text-sm font-medium text-black mb-2">
                      Election Name *
                    </label>
                    <input
                      id="electionName"
                      type="text"
                      value={electionName}
                      onChange={(e) => setElectionName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="e.g., Class Representative Election"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="className" className="block text-sm font-medium text-black mb-2">
                      Class Name *
                    </label>
                    <input
                      id="className"
                      type="text"
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="e.g., CSE-A, ECE-B"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="year" className="block text-sm font-medium text-black mb-2">
                      Year *
                    </label>
                    <input
                      id="year"
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="24"
                      min="20"
                      max="30"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="branch" className="block text-sm font-medium text-black mb-2">
                      Branch *
                    </label>
                    <select
                      id="branch"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.value} value={b.value}>
                          {b.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="section" className="block text-sm font-medium text-black mb-2">
                      Section (A=0, B=1, etc.) *
                    </label>
                    <input
                      id="section"
                      type="number"
                      value={section}
                      onChange={(e) => setSection(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      placeholder="0"
                      min="0"
                      max="10"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-black mb-2">
                      Start Date & Time *
                    </label>
                    <input
                      id="startDate"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-black mb-2">
                      End Date & Time *
                    </label>
                    <input
                      id="endDate"
                      type="datetime-local"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:ring-1 focus:ring-black outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Voting Configuration */}
              <div>
                <h2 className="text-xl font-semibold text-black mb-6">Voting Configuration</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      id="multiVote"
                      type="checkbox"
                      checked={multiVote}
                      onChange={(e) => setMultiVote(e.target.checked)}
                      className="h-4 w-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <label htmlFor="multiVote" className="ml-2 block text-sm text-black">
                      Enable multi-vote (allow voters to select multiple candidates)
                    </label>
                  </div>

                  {multiVote && (
                    <div className="ml-7">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label htmlFor="totalVotes" className="block text-sm font-medium text-black mb-2">
                            Total votes per voter
                          </label>
                          <input
                            id="totalVotes"
                            type="number"
                            value={totalVotesPerVoter}
                            onChange={(e) => setTotalVotesPerVoter(parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                            min="1"
                            max="10"
                          />
                        </div>

                        <div>
                          <label htmlFor="minMale" className="block text-sm font-medium text-black mb-2">
                            Male winners required
                          </label>
                          <input
                            id="minMale"
                            type="number"
                            value={minVotesMale}
                            onChange={(e) => setMinVotesMale(parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                            min="0"
                          />
                        </div>

                        <div>
                          <label htmlFor="minFemale" className="block text-sm font-medium text-black mb-2">
                            Female winners required
                          </label>
                          <input
                            id="minFemale"
                            type="number"
                            value={minVotesFemale}
                            onChange={(e) => setMinVotesFemale(parseInt(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Student Data Upload */}
              <div>
                <h2 className="text-xl font-semibold text-black mb-6">Student Data</h2>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-800 mb-2">📧 Email-Based Authentication</h4>
                  <p className="text-sm text-blue-700">
                    Students will now authenticate using Microsoft login with their institutional email addresses. 
                    Make sure your CSV contains an "Email" column with valid email addresses.
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Required columns: Roll Number, Name, Email, Gender (optional)
                  </p>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    <div className="space-y-4">
                      <div className="text-gray-400">
                        <svg className="mx-auto h-16 w-16" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <div className="text-gray-600">
                        {isUploading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                            <span>Creating Election...</span>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium text-black text-lg">Upload Student Data & Create Election</span>
                            <p className="text-sm mt-1">Click to upload CSV or Excel file with email addresses</p>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">CSV, XLSX, XLS files supported</div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
