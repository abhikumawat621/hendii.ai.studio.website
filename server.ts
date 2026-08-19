import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import * as XLSX from "xlsx";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing from environment variables.");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Developer Problem Solver Endpoint
app.post("/api/solve", async (req, res) => {
  try {
    const { problem, language, codeSnippet, errorLog } = req.body;

    if (!problem || typeof problem !== "string" || !problem.trim()) {
      return res.status(400).json({ error: "Problem description is required." });
    }

    const ai = getGeminiClient();

    const systemInstruction = `
You are DevSolve AI, a world-class senior staff software engineer and developer debugger.
Your goal is to provide realistic, production-ready, highly precise solutions to developer queries, code bugs, errors, architecture questions, and feature implementations.

Formatting guidelines:
1. Provide a direct, concise diagnosis of the problem or requirements.
2. Identify the root cause if an error or bug was supplied.
3. Supply complete, fully typed, ready-to-use production code fixes without missing imports or placeholders.
4. Explain key steps clearly for developers.
5. List 2-3 essential developer best practices or performance/security notes.
`.trim();

    const prompt = `
Language/Framework Context: ${language || "Auto-detect"}

User Problem/Request:
${problem}

${codeSnippet ? `Current Code Snippet:\n\`\`\`\n${codeSnippet}\n\`\`\`` : ""}
${errorLog ? `Error Log / Stack Trace:\n\`\`\`\n${errorLog}\n\`\`\`` : ""}

Return a structured JSON object.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Short 4-7 word title of the solution" },
            summary: { type: Type.STRING, description: "Direct summary of the problem and solution approach" },
            rootCause: { type: Type.STRING, description: "Detailed root cause analysis or rationale" },
            solutionCode: { type: Type.STRING, description: "Complete fixed or implemented code block with necessary imports" },
            codeLanguage: { type: Type.STRING, description: "Detected language e.g. typescript, python, javascript, sql, etc." },
            explanation: { type: Type.STRING, description: "Step-by-step developer explanation of the code changes" },
            bestPractices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 senior engineer recommendations and tips"
            }
          },
          required: ["title", "summary", "rootCause", "solutionCode", "codeLanguage", "explanation", "bestPractices"]
        }
      }
    });

    const solution = JSON.parse(response.text || "{}");
    res.json({ success: true, solution });
  } catch (error: any) {
    console.error("Developer Solver API error:", error);
    res.status(500).json({
      error: "Failed to solve developer problem.",
      details: error?.message || "Unknown server error"
    });
  }
});

// 2. Keyword Research & Intent Analysis Endpoint
app.post("/api/keywords/analyze", async (req, res) => {
  try {
    const { seedKeyword, niche, location } = req.body;
    const ai = getGeminiClient();

    const prompt = `Generate 8 high-impact keyword opportunities for a business in the niche "${niche || "General Business"}" based on the seed topic/keyword "${seedKeyword || "digital marketing"}". Location target: "${location || "United States"}".
Return realistic estimates for monthly search volume, keyword difficulty score (1-100), estimated cost-per-click (CPC in USD), search intent, competition level, actionable content strategy, recommended content type, and potential impact.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              keyword: { type: Type.STRING, description: "Target search query or phrase" },
              searchVolume: { type: Type.INTEGER, description: "Estimated monthly search volume e.g. 1800" },
              difficulty: { type: Type.INTEGER, description: "Keyword difficulty 1 to 100" },
              cpc: { type: Type.STRING, description: "Estimated CPC e.g. $2.40" },
              intent: {
                type: Type.STRING,
                description: "Search Intent: Informational, Navigational, Commercial, or Transactional",
              },
              competition: { type: Type.STRING, description: "Low, Medium, or High" },
              actionableStrategy: { type: Type.STRING, description: "Step by step strategy to rank for this keyword" },
              recommendedContentType: { type: Type.STRING, description: "e.g. Comparison Article, Local Landing Page, Video Tutorial" },
              potentialImpact: { type: Type.STRING, description: "High, Quick Win, or Long-term" },
            },
            required: ["keyword", "searchVolume", "difficulty", "cpc", "intent", "competition", "actionableStrategy", "recommendedContentType", "potentialImpact"],
          },
        },
      },
    });

    const text = response.text || "[]";
    const keywords = JSON.parse(text);
    res.json({ keywords });
  } catch (error: any) {
    console.error("Keyword Analysis API error:", error);
    res.status(500).json({ error: "Failed to generate keyword data.", details: error?.message });
  }
});

// 3. Instant Site Audit & SEO Optimization Tips API
app.post("/api/site-audit", async (req, res) => {
  try {
    const { url, businessType } = req.body;
    const ai = getGeminiClient();

    const prompt = `Perform an instant SEO audit & site optimization diagnosis for a website with URL/domain: "${url || "example.com"}" operating in business type: "${businessType || "Small Business"}".
Generate 6 prioritized optimization recommendations across Technical SEO, On-Page SEO, Content & Keyword Intent, and Local SEO.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "Technical, On-Page, Content Intent, or Local SEO" },
              issueTitle: { type: Type.STRING, description: "Concise title of the optimization opportunity" },
              severity: { type: Type.STRING, description: "Critical, Warning, or Opportunity" },
              impactScore: { type: Type.INTEGER, description: "Impact score 1 to 10" },
              explanation: { type: Type.STRING, description: "Why this matters for small business ranking" },
              actionableFix: { type: Type.STRING, description: "Exact code/content fix or step to execute" },
              estimatedTime: { type: Type.STRING, description: "e.g. 15 mins, 1 hour" },
            },
            required: ["category", "issueTitle", "severity", "impactScore", "explanation", "actionableFix", "estimatedTime"],
          },
        },
      },
    });

    const auditItems = JSON.parse(response.text || "[]");
    res.json({ auditItems });
  } catch (error: any) {
    console.error("Site Audit API error:", error);
    res.status(500).json({ error: "Failed to generate site audit", details: error?.message });
  }
});

// 4. AI Monthly Executive Summary Generator
app.post("/api/reports/generate-ai-summary", async (req, res) => {
  try {
    const { clientName, domain, organicGrowth, topKeywords, goalConversions } = req.body;
    const ai = getGeminiClient();

    const prompt = `Write a professional 2-paragraph executive summary for a monthly client SEO performance report.
Client Name: ${clientName}
Domain: ${domain}
Organic Growth: ${organicGrowth}% change
Top Ranking Keywords: ${topKeywords?.join(", ") || "Main commercial keywords"}
Conversions achieved: ${goalConversions || 120}

Tone: Professional, encouraging, clear ROI focus for small business management.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Report Summary error:", error);
    res.status(500).json({ error: "Failed to generate report summary" });
  }
});

// 5. Digital Marketing & AI Content Generator Endpoint
app.post("/api/generate-marketing-ai", async (req, res) => {
  try {
    const { toolType, businessName, niche, targetAudience, keyword, goal } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `
You are Hendii's Senior Digital Marketing & AI Assistant.
You specialize in creating high-converting, professional digital marketing assets:
- Facebook & Instagram (Meta) Ad Copy & Creative Hooks
- Search Engine Optimisation (SEO) Titles, Meta Descriptions & Focus Keyword Strategies
- Landing Page Structure & WordPress Development Blueprints
- AI Reel Scripts, Social Media Content & Prompts
- Strategic Marketing & Conversion Recommendations

Provide clear, professional, actionable content that helps businesses generate leads and grow.
Output must be structured JSON.
`.trim();

    let prompt = "";
    if (toolType === "fb_ads") {
      prompt = `Generate a complete Meta (Facebook & Instagram) Ad Campaign for Business: "${businessName || "My Brand"}", Industry/Niche: "${niche || "E-commerce/Services"}", Product/Service: "${keyword || "Primary Offering"}", Target Audience: "${targetAudience || "Ideal Clients"}", Campaign Goal: "${goal || "Leads & Conversions"}".
Provide 3 Ad Copy Variations (Hook, Primary Text, Headline, Call To Action, Creative Angle) and Audience Targeting Suggestions.`;
    } else if (toolType === "seo_meta") {
      prompt = `Generate a complete SEO On-Page & Technical Optimization Kit for Business: "${businessName || "My Brand"}", Industry/Niche: "${niche || "Business"}", Target Focus Keyword/Service: "${keyword || "Digital Services"}", Target Audience: "${targetAudience || "Local/Online Buyers"}".
Provide SEO Meta Titles, Meta Descriptions, URL Slugs, Heading Tag Hierarchy (H1, H2, H3), Target Keyword Intent Analysis, and On-Page Action Steps.`;
    } else if (toolType === "ai_video_script") {
      prompt = `Generate a Viral Video & Creative Content Strategy for Business: "${businessName || "Brand"}", Industry: "${niche || "General"}", Product: "${keyword || "Product/Service"}", Target Audience: "${targetAudience || "Customers"}".
Provide a 3-Scene Short Video Script, AI Image/Visual Generation Prompts, Social Media Caption, Hashtags, and Call to Action.`;
    } else {
      prompt = `Generate a Comprehensive Landing Page Structure & Marketing Growth Strategy for Business: "${businessName || "Brand"}", Industry: "${niche || "Service"}", Core Offering: "${keyword || "WordPress Website & Ads"}", Target Audience: "${targetAudience || "Business Owners"}", Goal: "${goal || "Growth"}".
Provide Landing Page Section Breakdown, Key Value Propositions, Conversion Triggers, Call to Action Placements, and Growth Recommendations.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title of the generated strategy or campaign" },
            overview: { type: Type.STRING, description: "Executive summary and strategy overview" },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  content: { type: Type.STRING },
                  bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["heading", "content", "bulletPoints"],
              },
            },
            proTip: { type: Type.STRING, description: "Actionable recommendation from Hendii" },
          },
          required: ["title", "overview", "sections", "proTip"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    res.json({ success: true, result });
  } catch (error: any) {
    console.error("Marketing AI error:", error);
    res.status(500).json({ success: false, error: "Failed to generate AI marketing content.", details: error?.message });
  }
});

// 6. Contact Form Leads Submission & Storage API
const LEADS_FILE_PATH = path.join(process.cwd(), "leads");
const EXCELSHEET_DIR = path.join(process.cwd(), "excelsheet");
const EXCEL_FILE_PATH = path.join(EXCELSHEET_DIR, "leads.xlsx");
const CSV_FILE_PATH = path.join(EXCELSHEET_DIR, "leads.csv");

const saveLeadsToExcel = (leads: any[]) => {
  try {
    if (!fs.existsSync(EXCELSHEET_DIR)) {
      fs.mkdirSync(EXCELSHEET_DIR, { recursive: true });
    }

    const rows = leads.map((l, index) => ({
      "S.No": index + 1,
      "Lead ID": l.id,
      "Date & Time": new Date(l.createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      "Client Name": l.name,
      "Phone Number": l.phone,
      "Email Address": l.email || "Not provided",
      "Service Requested": l.serviceNeeded || "General",
      "Project Message": l.message,
    }));

    const worksheetData = rows.length > 0 ? rows : [
      {
        "S.No": "-",
        "Lead ID": "-",
        "Date & Time": "-",
        "Client Name": "No leads submitted yet",
        "Phone Number": "-",
        "Email Address": "-",
        "Service Requested": "-",
        "Project Message": "-",
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);

    // Set auto column widths for Excel formatting
    worksheet["!cols"] = [
      { wch: 6 },  // S.No
      { wch: 18 }, // Lead ID
      { wch: 22 }, // Date & Time
      { wch: 22 }, // Client Name
      { wch: 16 }, // Phone Number
      { wch: 25 }, // Email Address
      { wch: 28 }, // Service Requested
      { wch: 45 }, // Project Message
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Leads");

    // 1. Write Excel file (.xlsx) as buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    fs.writeFileSync(EXCEL_FILE_PATH, excelBuffer);

    // 2. Write CSV file (.csv) as UTF-8 text so it can be opened directly in code editor
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    fs.writeFileSync(CSV_FILE_PATH, csvContent, "utf-8");

    console.log(`[Excel Sync] Saved ${leads.length} leads to ${EXCEL_FILE_PATH} & ${CSV_FILE_PATH}`);
  } catch (err) {
    console.error("Error writing to Excel/CSV sheet:", err);
  }
};

// Helper to read leads from 'leads' file
const readLeadsFromFile = (): Array<{
  id: string;
  name: string;
  phone: string;
  email?: string;
  serviceNeeded?: string;
  message: string;
  createdAt: string;
}> => {
  try {
    if (fs.existsSync(LEADS_FILE_PATH)) {
      const data = fs.readFileSync(LEADS_FILE_PATH, "utf-8");
      if (data.trim()) {
        return JSON.parse(data);
      }
    }
  } catch (err) {
    console.error("Error reading leads file:", err);
  }
  return [];
};

// Helper to save leads to both 'leads' JSON file and 'excelsheet/leads.xlsx'
const saveLeadsToFile = (leads: any[]) => {
  try {
    fs.writeFileSync(LEADS_FILE_PATH, JSON.stringify(leads, null, 2), "utf-8");
    saveLeadsToExcel(leads);
  } catch (err) {
    console.error("Error writing to leads file:", err);
  }
};

app.post("/api/contact", (req, res) => {
  try {
    const { name, phone, email, serviceNeeded, message } = req.body;
    if (!name || !phone || !message) {
      return res.status(400).json({ success: false, error: "Name, phone, and message are required fields." });
    }

    const newLead = {
      id: Date.now().toString(),
      name,
      phone,
      email: email || "Not provided",
      serviceNeeded: serviceNeeded || "General Consultation",
      message,
      createdAt: new Date().toISOString(),
    };

    const currentLeads = readLeadsFromFile();
    currentLeads.unshift(newLead);
    saveLeadsToFile(currentLeads);

    res.json({ success: true, message: "Lead submitted and saved to Excel sheet successfully", lead: newLead });
  } catch (err: any) {
    console.error("Error in /api/contact:", err);
    res.status(500).json({ success: false, error: "Failed to save lead" });
  }
});

app.get("/api/contact", (req, res) => {
  const currentLeads = readLeadsFromFile();
  res.json({ success: true, count: currentLeads.length, leads: currentLeads });
});

// Admin Excel download route
app.get("/api/admin/excel/download", (req, res) => {
  const currentLeads = readLeadsFromFile();
  saveLeadsToExcel(currentLeads);
  if (fs.existsSync(EXCEL_FILE_PATH)) {
    res.download(EXCEL_FILE_PATH, "leads.xlsx");
  } else {
    res.status(404).json({ success: false, error: "Excel sheet not found." });
  }
});

// Admin CSV download route
app.get("/api/admin/csv/download", (req, res) => {
  const currentLeads = readLeadsFromFile();
  saveLeadsToExcel(currentLeads);
  if (fs.existsSync(CSV_FILE_PATH)) {
    res.download(CSV_FILE_PATH, "leads.csv");
  } else {
    res.status(404).json({ success: false, error: "CSV sheet not found." });
  }
});

// Delete single lead
app.delete("/api/contact/:id", (req, res) => {
  try {
    const { id } = req.params;
    let currentLeads = readLeadsFromFile();
    currentLeads = currentLeads.filter((l) => l.id !== id);
    saveLeadsToFile(currentLeads);
    res.json({ success: true, message: "Lead deleted successfully", count: currentLeads.length });
  } catch (err) {
    console.error("Error deleting lead:", err);
    res.status(500).json({ success: false, error: "Failed to delete lead" });
  }
});

// Clear all leads
app.delete("/api/contact", (req, res) => {
  try {
    saveLeadsToFile([]);
    res.json({ success: true, message: "All leads cleared successfully", count: 0 });
  } catch (err) {
    console.error("Error clearing leads:", err);
    res.status(500).json({ success: false, error: "Failed to clear leads" });
  }
});

async function startServer() {
  // Sync existing leads to Excel and CSV on startup if any exist
  try {
    const existing = readLeadsFromFile();
    if (existing && existing.length > 0) {
      saveLeadsToExcel(existing);
    }
  } catch (e) {
    console.error("Failed initial Excel sync:", e);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
