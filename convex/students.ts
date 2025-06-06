import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Helper function to parse roll number
function parseRollNumber(rollNumber: string) {
  // Format: cb.sc.u4cse24124
  const parts = rollNumber.toLowerCase().split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid roll number format: ${rollNumber}`);
  }

  const campus = parts[0]; // cb
  const stream = parts[1]; // sc
  const programInfo = parts[2]; // u4cse24124

  const programType = programInfo[0]; // u
  const programLength = parseInt(programInfo[1]); // 4
  
  // Extract branch (3 characters after program length)
  const branch = programInfo.substring(2, 5); // cse
  
  // Extract year (2 digits)
  const year = parseInt(programInfo.substring(5, 7)); // 24
  
  // Extract section (1 digit)
  const section = parseInt(programInfo.substring(7, 8)); // 1
  
  // Extract roll in section (remaining digits)
  const rollInSection = parseInt(programInfo.substring(8)); // 24

  // Generate classId: cb.sc.u4cse241
  const classId = `${campus}.${stream}.${programType}${programLength}${branch}${year}${section}`;

  return {
    campus,
    stream,
    programType,
    programLength,
    branch,
    year,
    section,
    rollInSection,
    classId,
  };
}

export const uploadStudents = mutation({
  args: {
    studentsData: v.array(v.object({
      rollNumber: v.string(),
      name: v.string(),
      phone: v.string(),
      gender: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const processedStudents = [];
    const classStats = new Map();

    for (const studentData of args.studentsData) {
      try {
        const parsed = parseRollNumber(studentData.rollNumber);
        
        const student = {
          ...studentData,
          ...parsed,
          isCandidate: false,
          hasVoted: false,
        };

        // Check if student already exists
        const existing = await ctx.db
          .query("students")
          .withIndex("by_roll_number", (q) => q.eq("rollNumber", studentData.rollNumber))
          .unique();

        if (!existing) {
          await ctx.db.insert("students", student);
          processedStudents.push(student);

          // Update class stats
          const classId = parsed.classId;
          if (!classStats.has(classId)) {
            classStats.set(classId, {
              classId,
              campus: parsed.campus,
              stream: parsed.stream,
              programType: parsed.programType,
              programLength: parsed.programLength,
              branch: parsed.branch,
              year: parsed.year,
              section: parsed.section,
              studentCount: 0,
              candidateCount: 0,
              electionStarted: false,
            });
          }
          const stats = classStats.get(classId);
          stats.studentCount++;
        }
      } catch (error) {
        console.error(`Error processing roll number ${studentData.rollNumber}:`, error);
        // Skip invalid roll numbers
      }
    }

    // Update or create class records
    for (const [classId, classData] of classStats) {
      const existingClass = await ctx.db
        .query("classes")
        .withIndex("by_class_id", (q) => q.eq("classId", classId))
        .unique();

      if (existingClass) {
        await ctx.db.patch(existingClass._id, {
          studentCount: existingClass.studentCount + classData.studentCount,
        });
      } else {
        await ctx.db.insert("classes", classData);
      }
    }

    return {
      processed: processedStudents.length,
      total: args.studentsData.length,
      classesUpdated: classStats.size,
    };
  },
});

export const getClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});

export const getStudentsByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_class_id", (q) => q.eq("classId", args.classId))
      .collect();
  },
});

export const toggleCandidate = mutation({
  args: {
    studentId: v.id("students"),
    isCandidate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) {
      throw new Error("Student not found");
    }

    await ctx.db.patch(args.studentId, {
      isCandidate: args.isCandidate,
    });

    // Update class candidate count
    const classRecord = await ctx.db
      .query("classes")
      .withIndex("by_class_id", (q) => q.eq("classId", student.classId))
      .unique();

    if (classRecord) {
      const candidateCount = await ctx.db
        .query("students")
        .withIndex("by_class_candidates", (q) => 
          q.eq("classId", student.classId).eq("isCandidate", true)
        )
        .collect();

      await ctx.db.patch(classRecord._id, {
        candidateCount: candidateCount.length + (args.isCandidate ? 1 : -1),
      });
    }

    return { success: true };
  },
});

export const getCandidatesByClass = query({
  args: { classId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("students")
      .withIndex("by_class_candidates", (q) => 
        q.eq("classId", args.classId).eq("isCandidate", true)
      )
      .collect();
  },
});
