import React, { useState } from "react";
import { Header } from "./components/Header";
import { OverviewSection } from "./components/OverviewSection";
import { ServicesSection } from "./components/ServicesSection";
import { AIToolsSection } from "./components/AIToolsSection";
import { ContactSection } from "./components/ContactSection";
import { LeadsSection } from "./components/LeadsSection";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { TabType } from "./types";
import { MARKETER_INFO } from "./data/portfolioData";
import { MessageCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white flex flex-col relative overflow-x-hidden">
      {/* Animated Interactive Background */}
      <AnimatedBackground />

      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Router Views */}
        {activeTab === "overview" && <OverviewSection onSelectTab={setActiveTab} />}

        {activeTab === "services" && <ServicesSection onSelectTab={setActiveTab} />}

        {(activeTab === "ai_tools" || activeTab === "ai-tools") && (
          <AIToolsSection onSelectTab={setActiveTab} />
        )}

        {activeTab === "contact" && <ContactSection onSelectTab={setActiveTab} />}

        {activeTab === "leads" && (
          <LeadsSection onNavigateToContact={() => setActiveTab("contact")} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0D1117]/90 backdrop-blur-md border-t border-[#21262D] py-8 text-xs text-slate-400 font-mono mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">{MARKETER_INFO.name}</span>
            <span className="text-emerald-400 font-bold">— Digital Marketing & AI Specialist</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href={`https://wa.me/${MARKETER_INFO.whatsapp}?text=Hello%20Hendii,%20I%20would%20like%20to%20discuss%20my%20project.`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center space-x-1 font-bold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Chat on WhatsApp</span>
            </a>
            <button
              onClick={() => setActiveTab("contact")}
              className="hover:text-emerald-400 transition"
            >
              Contact
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">{MARKETER_INFO.location}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
