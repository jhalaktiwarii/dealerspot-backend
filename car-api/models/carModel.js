const { z } = require('zod');

const carSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  createdAt: z.string().optional(),
  model: z.string().min(1, "Model is required"),
  year: z.number().int().min(1900).max(new Date().getFullYear()),
  transmission: z.enum(['manual', 'auto']),
  color: z.string().min(1, "Color is required"),
  insurance: z.string().min(1, "Insurance details are required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  originalPrice: z.number().positive(),
  refurb: z.string().min(1, "Refurb details are required"),
  interestRate: z.number().min(0).max(100),
  fuel: z.enum(['petrol', 'diesel', 'cng', 'ev']),
  negotiationBuffer: z.number(),
  profitMargin: z.number(),
  currentPrice: z.number(),
  suggestedPrice: z.number(),
  description: z.string().min(1, "Description is required"),
  kmsDriven: z.number().int().positive(),
  companyName: z.string().min(1, "Company name is required"),
 });c

module.exports = { carSchema };
