export type TabType = "overview" | "services" | "ai_tools" | "contact" | "leads";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  serviceNeeded?: string;
  message: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  hinglishTitle: string;
  category: "WordPress" | "SEO" | "Paid Ads" | "AI Visuals";
  iconName: string;
  tagline: string;
  description: string;
  keyDeliverables: string[];
  toolsUsed: string[];
  popular: boolean;
}

export interface MarketingAIResult {
  title: string;
  overview: string;
  sections: {
    heading: string;
    content: string;
    bulletPoints: string[];
  }[];
  proTip: string;
}

export interface ContactMessage {
  name: string;
  phone: string;
  email: string;
  businessName: string;
  serviceSelected: string;
  budgetRange?: string;
  message: string;
}
