import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import Papa from "papaparse";

export function ExcelUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadStudents = useMutation(api.students.uploadStudents);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Find column indices
      const rollNumberIndex = headers.findIndex(h => h.includes('roll') || h.includes('number'));
      const nameIndex = headers.findIndex(h => h.includes('name'));
      const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
      const genderIndex = headers.findIndex(h => h.includes('gender') || h.includes('sex'));

      if (rollNumberIndex === -1 || nameIndex === -1) {
        toast.error("CSV must contain 'rollNumber' and 'name' columns");
        return;
      }

      const studentsData = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length > rollNumberIndex && values.length > nameIndex) {
          studentsData.push({
            rollNumber: values[rollNumberIndex],
            name: values[nameIndex],
            phone: phoneIndex !== -1 ? values[phoneIndex] || '' : '',
            gender: genderIndex !== -1 ? values[genderIndex] || 'Not specified' : 'Not specified',
          });
        }
      }

      if (studentsData.length === 0) {
        toast.error("No valid student data found in file");
        return;
      }

      const result = await uploadStudents({ studentsData });
      
      toast.success(
        `Successfully processed ${result.processed} out of ${result.total} students. ` +
        `Updated ${result.classesUpdated} classes.`
      );

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please check the format and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white border border-black p-6">
      <h2 className="text-xl font-semibold text-black mb-4">Upload Student Data</h2>
      
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">Upload a CSV file with the following columns:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-500">
            <li><strong>rollNumber</strong> (required): e.g., cb.sc.u4cse24124</li>
            <li><strong>name</strong> (required): Student's full name</li>
            <li><strong>phone</strong> (optional): Contact number</li>
            <li><strong>gender</strong> (optional): Male, Female, Other</li>
          </ul>
        </div>

        <div className="border-2 border-dashed border-black p-6 text-center hover:border-gray-600 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className={`cursor-pointer ${isUploading ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <div className="space-y-2">
              <div className="text-gray-400">
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-gray-600">
                {isUploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <>
                    <span className="font-medium text-black">Click to upload</span>
                    <span> or drag and drop</span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-400">CSV files only</div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
