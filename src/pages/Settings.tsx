import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const { state, setBusiness, reset } = useStore();
  const nav = useNavigate();
  const b = state.business;
  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <h1 className="font-display text-4xl mb-8">Settings</h1>
      <div className="rounded-2xl bg-gradient-card border border-border p-6 space-y-4">
        <div><Label>Business name</Label><Input className="mt-2" value={b.name} onChange={(e) => setBusiness({ name: e.target.value })} /></div>
        <div><Label>Industry</Label><Input className="mt-2" value={b.industry} onChange={(e) => setBusiness({ industry: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Country</Label><Input className="mt-2" value={b.country} onChange={(e) => setBusiness({ country: e.target.value })} /></div>
          <div><Label>City / municipality</Label><Input className="mt-2" value={b.city} onChange={(e) => setBusiness({ city: e.target.value })} /></div>
        </div>
        <div><Label>Who is your customer?</Label><Textarea className="mt-2" rows={2} value={b.customer} onChange={(e) => setBusiness({ customer: e.target.value })} /></div>
        <div><Label>Idea</Label><Textarea className="mt-2" rows={3} value={b.idea} onChange={(e) => setBusiness({ idea: e.target.value })} /></div>
        <div><Label>90-day goal</Label><Input className="mt-2" value={b.goal} onChange={(e) => setBusiness({ goal: e.target.value })} /></div>
      </div>
      <div className="mt-8">
        <Button variant="destructive" onClick={() => { if (confirm("Reset all progress?")) { reset(); nav("/"); } }}>Reset everything</Button>
      </div>
    </div>
  );
};

export default Settings;
