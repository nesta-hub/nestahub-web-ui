import { ArrowLeft } from "lucide-react";

interface FloatingBackButtonProps {
  onClick: () => void;
}

export function FloatingBackButton({ onClick }: FloatingBackButtonProps) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="w-10 h-10 rounded-full bg-card border border-border shadow-sm 
                 flex items-center justify-center shrink-0 
                 hover:bg-muted active:scale-95 transition-all"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </button>
  );
}
