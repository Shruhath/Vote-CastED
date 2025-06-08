import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const verifyVoterAccess = query({
  args: {
    electionId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if the email is registered for this election
    const student = await ctx.db
      .query("electionStudents")
      .withIndex("by_election_and_email", (q) => 
        q.eq("electionId", args.electionId).eq("email", args.email.toLowerCase())
      )
      .unique();
    
    if (!student) {
      return {
        hasAccess: false,
        message: "Your email is not registered for this election.",
      };
    }
    
    return {
      hasAccess: true,
      student: {
        rollNumber: student.rollNumber,
        name: student.name,
        email: student.email,
        hasVoted: student.hasVoted,
      },
    };
  },
});

export const getElectionCandidates = query({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();
    
    return candidates.map(candidate => ({
      rollNumber: candidate.rollNumber,
      name: candidate.name,
      gender: candidate.gender,
    }));
  },
});

export const castVote = mutation({
  args: {
    electionId: v.string(),
    voterEmail: v.string(),
    candidateRollNumbers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Verify voter is registered and hasn't voted
    const voter = await ctx.db
      .query("electionStudents")
      .withIndex("by_election_and_email", (q) => 
        q.eq("electionId", args.electionId).eq("email", args.voterEmail.toLowerCase())
      )
      .unique();
    
    if (!voter) {
      throw new Error("Voter not registered for this election");
    }
    
    if (voter.hasVoted) {
      throw new Error("You have already voted in this election");
    }
    
    // Get election details
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();
    
    if (!election) {
      throw new Error("Election not found");
    }
    
    if (election.status !== "open") {
      throw new Error("Election is not currently open for voting");
    }
    
    // Validate vote count
    if (election.multiVote) {
      if (args.candidateRollNumbers.length !== election.totalVotesPerVoter) {
        throw new Error(`You must select exactly ${election.totalVotesPerVoter} candidates`);
      }
    } else {
      if (args.candidateRollNumbers.length !== 1) {
        throw new Error("You must select exactly one candidate");
      }
    }
    
    // Verify all candidates exist and are valid
    for (const rollNumber of args.candidateRollNumbers) {
      const candidate = await ctx.db
        .query("electionStudents")
        .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
        .filter((q) => 
          q.and(
            q.eq(q.field("rollNumber"), rollNumber),
            q.eq(q.field("isCandidate"), true)
          )
        )
        .unique();
      
      if (!candidate) {
        throw new Error(`Invalid candidate: ${rollNumber}`);
      }
    }
    
    // If multi-vote with gender quota, validate gender distribution
    if (election.multiVote && (election.minVotesPerGender.Male > 0 || election.minVotesPerGender.Female > 0)) {
      const candidateGenders = await Promise.all(
        args.candidateRollNumbers.map(async (rollNumber) => {
          const candidate = await ctx.db
            .query("electionStudents")
            .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
            .filter((q) => q.eq(q.field("rollNumber"), rollNumber))
            .unique();
          return candidate?.gender;
        })
      );
      
      const maleVotes = candidateGenders.filter(gender => gender === "Male").length;
      const femaleVotes = candidateGenders.filter(gender => gender === "Female").length;
      
      if (maleVotes < election.minVotesPerGender.Male) {
        throw new Error(`You must vote for at least ${election.minVotesPerGender.Male} male candidates`);
      }
      
      if (femaleVotes < election.minVotesPerGender.Female) {
        throw new Error(`You must vote for at least ${election.minVotesPerGender.Female} female candidates`);
      }
    }
    
    // Cast votes
    const timestamp = Date.now();
    for (const candidateRollNumber of args.candidateRollNumbers) {
      await ctx.db.insert("votes", {
        electionId: args.electionId,
        voterEmail: args.voterEmail.toLowerCase(),
        candidateRollNumber,
        timestamp,
      });
    }
    
    // Mark voter as having voted
    await ctx.db.patch(voter._id, { hasVoted: true });
    
    return { success: true };
  },
});

export const getElectionResults = query({
  args: { electionId: v.string() },
  handler: async (ctx, args) => {
    // Get all votes for this election
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .collect();
    
    // Get all candidates
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();
    
    // Count votes per candidate
    const voteCounts = new Map<string, number>();
    votes.forEach(vote => {
      const current = voteCounts.get(vote.candidateRollNumber) || 0;
      voteCounts.set(vote.candidateRollNumber, current + 1);
    });
    
    // Prepare results
    const results = candidates.map(candidate => ({
      rollNumber: candidate.rollNumber,
      name: candidate.name,
      gender: candidate.gender,
      votes: voteCounts.get(candidate.rollNumber) || 0,
    }));
    
    // Get unique voters count
    const uniqueVoters = new Set(votes.map(vote => vote.voterEmail));
    
    return {
      results: results.sort((a, b) => b.votes - a.votes),
      totalVotes: votes.length,
      totalVoters: uniqueVoters.size,
    };
  },
});
