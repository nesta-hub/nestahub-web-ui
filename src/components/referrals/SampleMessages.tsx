import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { sampleMessages } from "./referralData";

export function SampleMessages() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copy = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedId(id);
      toast.success("Message copied — paste it in WhatsApp.");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Couldn't copy. Long-press to select.");
    }
  };

  const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section className="space-y-5">
      <div className="max-w-2xl">
        <p className="text-xs font-medium text-nesta-sage uppercase tracking-widest mb-2">
          Sample messages
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">
          Not sure what to say?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Copy one of these and tweak with your code.
        </p>
      </div>

      <Tabs defaultValue={sampleMessages[0].id} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          {sampleMessages.map((m) => (
            <TabsTrigger key={m.id} value={m.id}>{m.label}</TabsTrigger>
          ))}
        </TabsList>

        {sampleMessages.map((m) => (
          <TabsContent key={m.id} value={m.id}>
            {/* Phone-like canvas */}
            <div
              className="rounded-2xl border border-border p-6 md:p-10"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--nesta-cream)) 0%, hsl(var(--nesta-tan) / 0.25) 100%)",
              }}
            >
              <div className="max-w-md mx-auto">
                {/* Chat bubble */}
                <div className="relative bg-nesta-sage/15 text-foreground rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm ml-auto">
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">
                    {m.body}
                  </p>
                  <div className="mt-1.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                    <span>{now}</span>
                    <CheckCheck className="w-3.5 h-3.5 text-nesta-sage" />
                  </div>
                  {/* tail */}
                  <span
                    className="absolute -right-1 top-0 w-3 h-3 bg-nesta-sage/15"
                    style={{ clipPath: "polygon(0 0, 100% 0, 0 100%)" }}
                    aria-hidden
                  />
                </div>

                <p className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Tap to copy
                </p>

                <div className="mt-3 flex justify-center">
                  <Button
                    onClick={() => copy(m.id, m.body)}
                    variant="outline"
                    size="sm"
                    className="bg-card"
                  >
                    {copiedId === m.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedId === m.id ? "Copied" : "Copy message"}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
