import { Router, Request, Response } from "express";
import { getAllCompanies, getCompanyById, upsertCompanyData, CompanyData } from "../services/rag.js";

export const companiesRouter = Router();

/**
 * GET /api/companies
 * List all available companies
 */
companiesRouter.get("/", (_req: Request, res: Response) => {
  const companies = getAllCompanies();
  res.json({
    companies: companies.map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.metadata.industry,
      website: c.metadata.website,
    })),
  });
});

/**
 * GET /api/companies/:id
 * Get specific company details
 */
companiesRouter.get("/:id", (req: Request, res: Response) => {
  const company = getCompanyById(req.params.id);
  if (!company) {
    return res.status(404).json({ error: "Company not found" });
  }
  res.json(company);
});

/**
 * POST /api/companies
 * Add or update company data
 */
companiesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body as CompanyData;

    if (!data.id || !data.name || !data.content) {
      return res.status(400).json({
        error: "Missing required fields: id, name, content",
      });
    }

    await upsertCompanyData({
      ...data,
      metadata: {
        ...data.metadata,
        lastUpdated: new Date().toISOString(),
      },
    });

    res.json({ success: true, company: data });
  } catch (error) {
    console.error("Error saving company:", error);
    res.status(500).json({ error: "Failed to save company data" });
  }
});
