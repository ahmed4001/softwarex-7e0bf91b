import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Zap, Scale, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewTemplate {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  prompts: { title: string; pros: string; cons: string; body: string };
}

const templates: ReviewTemplate[] = [
  {
    id: "detailed",
    icon: FileText,
    label: "Detailed Review",
    description: "Comprehensive analysis with pros, cons, and use cases",
    prompts: {
      title: "",
      pros: "What I liked most:\n• \n• \n• ",
      cons: "Areas for improvement:\n• \n• ",
      body: "I've been using this product for [duration]. Here's my experience:\n\n**Setup & Onboarding:**\n\n**Day-to-day Usage:**\n\n**Would I recommend it?**\n",
    },
  },
  {
    id: "quick",
    icon: Zap,
    label: "Quick Take",
    description: "Short and punchy — great for fast feedback",
    prompts: {
      title: "",
      pros: "",
      cons: "",
      body: "In a nutshell: ",
    },
  },
  {
    id: "comparison",
    icon: Scale,
    label: "Comparison Review",
    description: "Compare this product to alternatives you've tried",
    prompts: {
      title: "",
      pros: "Where it wins vs alternatives:\n• ",
      cons: "Where alternatives do better:\n• ",
      body: "I switched from [previous tool] to this product because...\n\nCompared to the competition:\n",
    },
  },
  {
    id: "use-case",
    icon: Heart,
    label: "Use Case Story",
    description: "Tell the story of how this product solved your problem",
    prompts: {
      title: "",
      pros: "",
      cons: "",
      body: "**The Problem:** \n\n**Why I chose this product:** \n\n**The Result:** \n\n**Who I'd recommend it to:** ",
    },
  },
];

interface ReviewTemplateSelectorProps {
  onSelect: (prompts: ReviewTemplate["prompts"]) => void;
}

export function ReviewTemplateSelector({ onSelect }: ReviewTemplateSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Start with a template (optional)</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {templates.map((tpl) => {
          const Icon = tpl.icon;
          const isSelected = selected === tpl.id;
          return (
            <button
              key={tpl.id}
              onClick={() => {
                setSelected(tpl.id);
                onSelect(tpl.prompts);
              }}
              className={cn(
                "p-4 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-primary/5",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 bg-card/50"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-semibold text-foreground">{tpl.label}</p>
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{tpl.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
