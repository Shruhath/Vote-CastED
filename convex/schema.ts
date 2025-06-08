import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  elections: defineTable({
    electionId: v.string(),
    electionName: v.string(),
    className: v.optional(v.string()),
    campus: v.string(),
    stream: v.string(),
    programType: v.string(),
    programLength: v.number(),
    branch: v.string(),
    year: v.number(),
    section: v.number(),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    status: v.string(), // "created", "open", "closed"
    studentCount: v.number(),
    candidateCount: v.number(),
    multiVote: v.boolean(),
    totalVotesPerVoter: v.number(),
    minVotesPerGender: v.object({
      Male: v.number(),
      Female: v.number(),
    }),
  })
    .index("by_election_id", ["electionId"])
    .index("by_status", ["status"]),

  electionStudents: defineTable({
    electionId: v.string(),
    rollNumber: v.string(),
    name: v.string(),
    email: v.optional(v.string()), // Made optional for migration
    phone: v.optional(v.string()), // Keep for backward compatibility
    gender: v.string(),
    isCandidate: v.boolean(),
    hasVoted: v.boolean(),
  })
    .index("by_election", ["electionId"])
    .index("by_email", ["email"]) // Changed from phone to email
    .index("by_roll_number", ["rollNumber"])
    .index("by_election_and_email", ["electionId", "email"]), // New compound index

  votes: defineTable({
    electionId: v.string(),
    voterEmail: v.optional(v.string()), // Made optional for migration
    voterPhone: v.optional(v.string()), // Keep for backward compatibility
    candidateRollNumber: v.string(),
    timestamp: v.number(),
  })
    .index("by_election", ["electionId"])
    .index("by_voter", ["voterEmail"]) // Changed from voterPhone to voterEmail
    .index("by_candidate", ["candidateRollNumber"]),

  // New admin table for secure login
  admins: defineTable({
    username: v.string(),
    password: v.string(),
  })
    .index("by_username", ["username"]),

  // Legacy tables for compatibility
  students: defineTable({
    rollNumber: v.string(),
    name: v.string(),
    phone: v.string(),
    gender: v.string(),
    campus: v.string(),
    stream: v.string(),
    programType: v.string(),
    programLength: v.number(),
    branch: v.string(),
    year: v.number(),
    section: v.number(),
    rollInSection: v.number(),
    classId: v.string(),
    isCandidate: v.boolean(),
    hasVoted: v.boolean(),
  })
    .index("by_roll_number", ["rollNumber"])
    .index("by_class_id", ["classId"])
    .index("by_class_candidates", ["classId", "isCandidate"]),

  classes: defineTable({
    classId: v.string(),
    campus: v.string(),
    stream: v.string(),
    programType: v.string(),
    programLength: v.number(),
    branch: v.string(),
    year: v.number(),
    section: v.number(),
    studentCount: v.number(),
    candidateCount: v.number(),
    electionStarted: v.boolean(),
  }).index("by_class_id", ["classId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
