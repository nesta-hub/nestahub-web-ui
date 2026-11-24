import { toast } from "sonner";

/** Share a product's page: the phone's own share sheet where there is one, otherwise copy the link. */
export async function shareProduct(title: string, slug: string): Promise<void> {
  const url = `${window.location.origin}/catalogue/${slug}`;
  const text = `Check out ${title} on Nesta Hub`;

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard", { duration: 2500 });
  } catch {
    toast.error("Unable to share. Please try again.");
  }
}
