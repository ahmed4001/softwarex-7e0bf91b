import { Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

interface Props {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: Props) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    { name: "X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { name: "LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: "Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-1">Share</span>
      {links.map((l) => (
        <Button
          key={l.name}
          variant="outline"
          size="icon"
          asChild
          className="h-9 w-9 rounded-full"
          aria-label={`Share on ${l.name}`}
        >
          <a href={l.href} target="_blank" rel="noopener noreferrer">
            <l.icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        onClick={copyLink}
        className="h-9 w-9 rounded-full"
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
