import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const castVote = mutation({
  args: {
    electionId: v.string(),
    voterPhone: v.string(),
    candidateRollNumbers: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if election exists and is open
    const election = await ctx.db
      .query("elections")
      .withIndex("by_election_id", (q) => q.eq("electionId", args.electionId))
      .unique();

    if (!election) {
      throw new Error("Election not found");
    }

    if (election.status !== "open") {
      throw new Error("Election is not open for voting");
    }

    // Check if voter is eligible
    const voter = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("phone"), args.voterPhone))
      .unique();

    if (!voter) {
      throw new Error("You are not registered for this election");
    }

    if (voter.hasVoted) {
      throw new Error("You have already voted in this election");
    }

    // Validate candidates exist and are actually candidates
    const candidates = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("isCandidate"), true))
      .collect();

    const candidateRollNumbers = candidates.map(c => c.rollNumber);
    
    for (const rollNumber of args.candidateRollNumbers) {
      if (!candidateRollNumbers.includes(rollNumber)) {
        throw new Error(`Invalid candidate: ${rollNumber}`);
      }
    }

    // Validate vote count
    if (election.multiVote) {
      if (args.candidateRollNumbers.length > election.totalVotesPerVoter) {
        throw new Error(`You can only vote for up to ${election.totalVotesPerVoter} candidates`);
      }

      // Check gender requirements
      const selectedCandidates = candidates.filter(c => 
        args.candidateRollNumbers.includes(c.rollNumber)
      );
      
      const maleVotes = selectedCandidates.filter(c => c.gender === "Male").length;
      const femaleVotes = selectedCandidates.filter(c => c.gender === "Female").length;

      if (maleVotes < election.minVotesPerGender.Male) {
        throw new Error(`You must vote for at least ${election.minVotesPerGender.Male} male candidates`);
      }

      if (femaleVotes < election.minVotesPerGender.Female) {
        throw new Error(`You must vote for at least ${election.minVotesPerGender.Female} female candidates`);
      }
    } else {
      if (args.candidateRollNumbers.length !== 1) {
        throw new Error("You can only vote for one candidate");
      }
    }

    // Cast the votes
    for (const candidateRollNumber of args.candidateRollNumbers) {
      await ctx.db.insert("votes", {
        electionId: args.electionId,
        voterPhone: args.voterPhone,
        candidateRollNumber,
        timestamp: Date.now(),
      });
    }

    // Mark voter as having voted
    await ctx.db.patch(voter._id, {
      hasVoted: true,
    });

    return { success: true };
  },
});

export const getVoterStatus = query({
  args: {
    electionId: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const voter = await ctx.db
      .query("electionStudents")
      .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
      .filter((q) => q.eq(q.field("phone"), args.phoneNumber))
      .unique();

    if (!voter) {
      return { hasVoted: false, voter: null };
    }

    return { hasVoted: voter.hasVoted, voter };
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

    // Count votes for each candidate
    const voteCount: Record<string, number> = {};
    for (const vote of votes) {
      voteCount[vote.candidateRollNumber] = (voteCount[vote.candidateRollNumber] || 0) + 1;
    }

    // Create results array
    const results = candidates.map(candidate => ({
      rollNumber: candidate.rollNumber,
      name: candidate.name,
      gender: candidate.gender,
      votes: voteCount[candidate.rollNumber] || 0,
    }));

    // Sort by vote count (descending)
    results.sort((a, b) => b.votes - a.votes);

    return {
      results,
      totalVotes: votes.length,
      totalVoters: await ctx.db
        .query("electionStudents")
        .withIndex("by_election", (q) => q.eq("electionId", args.electionId))
        .filter((q) => q.eq(q.field("hasVoted"), true))
        .collect()
        .then(voters => voters.length),
    };
  },
});
