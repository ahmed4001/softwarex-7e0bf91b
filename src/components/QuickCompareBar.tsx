import { create } from "zustand";
import { Button } from "@/components/ui/button";
import { ProductLogo } from "@/components/ProductLogo";
import { X, ArrowLeftRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface CompareItem {
  id: string;
  name: string;
  logo_url?: string | null;
  slug: string;
}

interface CompareStore {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
}

export const useCompareStore = create<CompareStore>((set, get) => ({
  items: [],
  addItem: (item) => {
    const current = get().items;
    if (current.length >= 4 || current.some((i) => i.id === item.id)) return;
    set({ items: [...current, item] });
  },
  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
  clear: () => set({ items: [] }),
}));

export function QuickCompareBar() {
  const { items, removeItem, clear } = useCompareStore();

  if (items.length === 0) return null;

  const compareUrl = `/compare?products=${items.map((i) => i.id).join(",")}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
      >
        <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-3 flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground px-2">
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Compare
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-2 py-1.5 flex-shrink-0"
              >
                <ProductLogo name={item.name} logoUrl={item.logo_url} size="xs" />
                <span className="text-xs font-medium text-foreground truncate max-w-20">{item.name}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="h-4 w-4 rounded-full hover:bg-destructive/10 flex items-center justify-center"
                >
                  <X className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              </div>
            ))}
            {items.length < 4 && (
              <div className="text-[10px] text-muted-foreground/50 px-2 flex-shrink-0">
                +{4 - items.length} more
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={clear} className="text-xs h-8 px-2">
              Clear
            </Button>
            {items.length >= 2 && (
              <Link to={compareUrl}>
                <Button size="sm" className="rounded-xl h-8 gap-1 text-xs font-semibold">
                  Compare {items.length}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
