import React from "react";
import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

const Block = ({ title, children }) => (
  <section className="space-y-3">
    <h2 className="font-display text-2xl text-[#D4AF37]">{title}</h2>
    <div className="text-slate-300 space-y-2 leading-relaxed">{children}</div>
  </section>
);

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" updated="May 2026">
      <Block title="What we collect">
        <p>Foundry stores only what you type into the app: your business profile (name, industry, country, stage, idea), your tasks, your saved Vault documents, and your chat messages with the AI agents.</p>
        <p>We do <b>not</b> ask for IDs, passwords to government portals, payment info, or any biometric data.</p>
        <p>We use a session ID generated in your browser. It is the only identifier we use; no email or phone number is required.</p>
      </Block>
      <Block title="How we use it">
        <ul className="list-disc pl-5 space-y-1">
          <li>To personalize the AI agent responses to your business profile.</li>
          <li>To remember your tasks and saved documents across visits.</li>
          <li>To improve performance and reliability of the service.</li>
        </ul>
      </Block>
      <Block title="Third parties">
        <p>Your prompts are sent to <b>OpenRouter</b> which routes to free open-source LLMs (e.g. Gemma, GLM, Nemotron, GPT-OSS). They are processed only to generate your reply. We do not sell your data.</p>
        <p>Anonymous product analytics may be collected to improve the app.</p>
      </Block>
      <Block title="Your rights">
        <p>You can wipe your local profile and chat history at any time from the sidebar (Reset Profile). For server-side deletion of stored data tied to your session ID, contact <a className="text-[#38BDF8] underline" href="mailto:privacy@foundry.app">privacy@foundry.app</a>.</p>
        <p>If you are in the EU/UK (GDPR), South Africa (POPIA), California (CCPA), or any region with data-protection laws, you may request access, correction, or deletion of your data.</p>
      </Block>
      <Block title="Children">
        <p>Foundry is not directed at children under 13. If you believe a minor has provided data, contact us and we will remove it.</p>
      </Block>
      <Block title="Security">
        <p>Data is transmitted over TLS. We do not store credentials. AI conversations are kept for your benefit and may be deleted on request.</p>
      </Block>
      <Block title="Changes">
        <p>We will post changes to this policy here with a new "Updated" date. Continued use after changes is acceptance.</p>
      </Block>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service" updated="May 2026">
      <Block title="The deal">
        <p>Foundry gives you access to AI agents that help with business ideation, compliance navigation, brand, operations, marketing and sales practice.</p>
        <p>Foundry is an information and productivity tool. <b>It is not legal, tax, financial, or medical advice.</b> Always confirm important decisions with a licensed professional in your jurisdiction.</p>
      </Block>
      <Block title="AI may be wrong">
        <p>AI agents can produce inaccurate or out-of-date information. Treat outputs as drafts and starting points — verify before acting on anything material (filings, contracts, claims, regulatory deadlines, etc.).</p>
      </Block>
      <Block title="Acceptable use">
        <ul className="list-disc pl-5 space-y-1">
          <li>Do not use Foundry for unlawful, harmful, or deceptive activity.</li>
          <li>Do not attempt to abuse or overwhelm the free model providers.</li>
          <li>You are responsible for the content you submit and for verifying the AI's output.</li>
        </ul>
      </Block>
      <Block title="Your content">
        <p>You own what you create. By using Foundry, you grant us a limited license to process your inputs solely to operate the service.</p>
      </Block>
      <Block title="Liability">
        <p>To the maximum extent permitted by law, Foundry is provided "as is" without warranties. We are not liable for indirect or consequential damages arising from your use of the service.</p>
      </Block>
      <Block title="Termination">
        <p>You can stop using Foundry anytime. We may suspend access for abuse or violations of these terms.</p>
      </Block>
      <Block title="Contact">
        <p>Questions? <a className="text-[#38BDF8] underline" href="mailto:hello@foundry.app">hello@foundry.app</a></p>
      </Block>
    </LegalShell>
  );
}

function LegalShell({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-[#0A0F1A] text-white">
      <header className="border-b border-white/5">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" data-testid="legal-home-link"><Logo size={22} /></Link>
          <nav className="flex gap-5 text-sm text-slate-400">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-2">Last updated · {updated}</div>
        <h1 className="font-display text-4xl mb-8">{title}</h1>
        <div className="space-y-8">{children}</div>
      </main>
    </div>
  );
}
