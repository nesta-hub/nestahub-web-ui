import type { ReactNode } from "react";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  /** A line under the title. */
  subtitle?: string;
  children: ReactNode;
  /** Pinned under the content (the Save button). */
  footer?: ReactNode;
  /** Something above the title: the item's picture and name. */
  header?: ReactNode;
}

/**
 * A bottom drawer in the subscription style: no X and no back arrow, tap outside or drag
 * down to close. One drawer holds a whole flow, with its content swapping inside it.
 */
export function BottomSheet({ open, onClose, title, subtitle, children, footer, header }: Props) {
  return (
    <Drawer open={open} onOpenChange={(next) => !next && onClose()}>
      <DrawerContent
        className="max-h-[92%] rounded-t-[28px] border-0 bg-shop-cream text-shop-ink shadow-[0_-16px_40px_-12px_rgba(51,38,28,0.4)]"
        handleClassName="mx-auto mb-3.5 mt-2.5 h-1 w-10 shrink-0 rounded-[2px] bg-[#D5CCC1]"
      >
        <div className="px-5">
          {header}
          <DrawerTitle className={header ? "sr-only" : "text-[20px] font-extrabold leading-[25px] tracking-[-0.01em]"}>{title}</DrawerTitle>
          {subtitle ? (
            <DrawerDescription className="text-[12.5px] leading-[17px] text-shop-muted">{subtitle}</DrawerDescription>
          ) : (
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2 pt-2">{children}</div>
        {footer && <div className="border-t border-[#EEE8E1] px-5 pb-[22px] pt-3">{footer}</div>}
        {!footer && <div className="h-4" />}
      </DrawerContent>
    </Drawer>
  );
}

/** The big rounded button the drawers end with. */
export function BigButton({
  children,
  onClick,
  disabled,
  tone = "ink",
  busy,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "ink" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      className={`flex w-full items-center justify-center text-[15px] font-extrabold text-shop-cream disabled:opacity-50 ${tone === "danger" ? "h-[52px] rounded-[26px] bg-[#9A4A3A]" : "h-14 rounded-[28px] bg-shop-cta hover:bg-shop-cta-hover"}`}
    >
      {busy ? "One moment…" : children}
    </button>
  );
}

/** A quiet text button under a big one: "Never mind". */
export function TextButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mt-0.5 flex h-12 w-full items-center justify-center text-[14px] font-bold text-shop-brown">
      {children}
    </button>
  );
}

/** A row in a drawer's menu: a round icon, a label, what it is now, and a chevron. */
export function MenuRow({
  icon,
  label,
  detail,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[60px] w-full items-center gap-3 border-b border-[#EEE8E1] text-left ${danger ? "text-[#9A4A3A]" : "text-shop-ink"}`}
    >
      <span aria-hidden="true" className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EFEAE4] ${danger ? "" : "text-shop-brown"}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-[15px] font-bold leading-5">{label}</span>
      {detail && <span className="max-w-[40%] truncate text-[13px] font-semibold leading-[18px] text-[#6B5F55]">{detail}</span>}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9A8F85" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  );
}
