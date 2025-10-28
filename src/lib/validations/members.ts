import { z } from "zod";

export const updateMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  role: z.string().min(1, "Role is required"),
  teamId: z.string().optional(),
});

export const removeMemberSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
});
