import z from "zod";

export const createLabSchema = z.object({
  name: z.string().min(1, "Lab name is required"),
});

export const inviteSchema = z.object({
  email: z.email("Valid email is required"),
  role: z.enum(["org-owner", "lab-admin", "lab-cls", "lab-technician", "doctor", "receptionist"], {
    error: "Please select a role",
  }),
  teamId: z.string().min(1, "Please select a lab"),
});
