const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export interface GenerateImageOptions {
  prompt: string;
}

export async function generateImage({ prompt }: GenerateImageOptions): Promise<string> {
  const apiKey = import.meta.env.VITE_LOVABLE_API_KEY;

  if (!apiKey) {
    throw new Error("LOVABLE_API_KEY is not configured. Please add it in project secrets.");
  }

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.statusText}`);
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

  if (!imageUrl) {
    throw new Error("No image returned from AI");
  }

  return imageUrl;
}

export const IMAGE_PROMPTS = {
  hero: "Premium baby care products elegantly arranged along the bottom edge and sides of the frame, leaving the center-top area completely clear and empty for text overlay. Soft cream and warm beige tones, natural daylight, lifestyle photography, minimal and sophisticated, products include diapers, wipes, lotions. Ultra high resolution, 16:9 aspect ratio hero image.",
  bundles: "Gift box overflowing with premium baby care products on a light cream pedestal, warm beige background, soft studio lighting, elegant and minimal, no text, lifestyle product photography. Ultra high resolution.",
  explore: "Assorted baby care items standing upright on an elevated cream-colored platform, warm tan background, soft diffused lighting, clean and minimal composition, no text. Ultra high resolution.",
  giftCards: "Elegant gift card with ribbon on a soft cream background, warm golden accents, premium aesthetic, studio lighting, minimal and sophisticated, no text. Ultra high resolution.",
};

export const CATEGORY_ICON_PROMPTS = {
  diapers: "Simple minimalist line-art icon of a folded baby diaper with curved edges showing the classic diaper shape, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
  wipes: "Simple minimalist line-art icon of a rectangular wipes container with one wipe tissue sticking out from the top opening, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
  bodyLotion: "Simple minimalist line-art icon of a pump bottle dispenser with tall cylindrical body and pump top, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
  bodyCream: "Simple minimalist line-art icon of a round cosmetic jar with screw-top lid short and wide container, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
  babyWash: "Simple minimalist line-art icon of a squeeze bottle with flip-top cap and small bubble decorations, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
  babyOil: "Simple minimalist line-art icon of an oil bottle with narrow neck and a single droplet above it, drawn with a single tan/brown color (#A08B76), clean vector style with consistent stroke width, white background, no shadows, no gradients, elegant and minimal, 128x128 pixels, suitable for a premium baby care brand.",
};
