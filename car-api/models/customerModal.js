const { z } = require('zod');

const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Invalid phone number"),
  carInterested: z.string().min(1, "Car model is required"),
  budget: z.number().positive("Budget must be a positive number"),
  transmissionPreference: z.enum(["automatic", "manual", "hybrid"]),
  comments: z.string().optional(),
  isWalkIn: z.boolean()
});

module.exports = customerSchema;