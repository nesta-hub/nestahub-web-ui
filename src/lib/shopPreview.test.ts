import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// The serverless function, which lives outside src; its routing is in vercel.json.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore plain JavaScript
import { previewFor } from "../../api/shop.js";
import vercel from "../../vercel.json";
import { category, group } from "@/components/catalogue/v3/testFixtures";

const CLOUDINARY = "https://res.cloudinary.com/nestahub/image/upload/v1/nesta-hub/categories/diaper.png";
const tree = {
  groups: [
    group("baby-care", "Body Care ", [
      category("diaper", "Diapers", { imageUrl: CLOUDINARY }),
      category("wipes", "Wipes", { description: "<p>Soft   wipes</p>" }),
      category("body-wash", "Body Wash"),
      category("shampoo", "Shampoo"),
    ]),
    group("empty", "Empty", []),
  ],
  ungrouped: [category("raincoat", "Raincoats")],
};

describe("what a link's preview says", () => {
  it("names a category and shows its picture", () => {
    expect(previewFor(tree, "baby-care", "diaper")).toEqual({
      title: "Diapers | NestaHub",
      description: "Shop Diapers for your little one on NestaHub.",
      image: CLOUDINARY,
    });
  });

  it("uses the category's own description, without its markup", () => {
    expect(previewFor(tree, "baby-care", "wipes").description).toBe("Soft wipes");
  });

  it("names a group, what is in it, and shows its first picture", () => {
    expect(previewFor(tree, "baby-care")).toEqual({
      title: "Body Care | NestaHub",
      description: "Diapers, Wipes, Body Wash and more. Shop it all on NestaHub.",
      image: CLOUDINARY,
    });
  });

  it("finds a category that has moved group, or has none", () => {
    expect(previewFor(tree, "old-group", "diaper").title).toBe("Diapers | NestaHub");
    expect(previewFor(tree, "all", "raincoat").title).toBe("Raincoats | NestaHub");
  });

  it("falls back to the group for a category that is gone, and to the shop for anything else", () => {
    expect(previewFor(tree, "baby-care", "gone").title).toBe("Body Care | NestaHub");
    expect(previewFor(tree, "gone", "gone").title).toBe("Shop NestaHub");
    expect(previewFor(null, "baby-care", "diaper").title).toBe("Shop NestaHub");
  });
});

describe("the page it answers with", () => {
  const respond = async (treeResponse: unknown, query: Record<string, string>) => {
    vi.resetModules(); // it keeps the tree between requests
    vi.stubGlobal("fetch", treeResponse);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore plain JavaScript
    const { default: handler } = await import("../../api/shop.js");
    const headers: Record<string, string> = {};
    let body = "";
    const res = {
      setHeader: (k: string, v: string) => void (headers[k] = v),
      status: () => res,
      send: (html: string) => void (body = html),
    };
    await handler({ query }, res);
    return { headers, body };
  };
  const answering = (data: unknown) => vi.fn(async () => ({ ok: true, json: async () => data }));

  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("sizes the picture for a large preview, and cuts nothing out of it", async () => {
    const { body } = await respond(answering(tree), { group: "baby-care", category: "diaper" });

    expect(body).toContain('property="og:title" content="Diapers | NestaHub"');
    expect(body).toContain("/upload/w_1200,h_630,c_pad,b_auto,f_jpg,q_auto/v1/nesta-hub/categories/diaper.png");
    expect(body).not.toContain("background_removal");
  });

  it("is never cached: a shopper gets a different page at the same address", async () => {
    const { headers } = await respond(answering(tree), { group: "baby-care" });

    expect(headers["Cache-Control"]).toContain("no-store");
  });

  it("escapes what staff typed", async () => {
    const nasty = { groups: [group("g", 'A "<script>" & B', [])], ungrouped: [] };
    const { body } = await respond(answering(nasty), { group: "g" });

    expect(body).toContain("A &quot;&lt;script&gt;&quot; &amp; B | NestaHub");
    expect(body).not.toContain("<script>");
  });

  it("still answers, generically, when the API is down", async () => {
    const { body } = await respond(vi.fn(async () => Promise.reject(new Error("down"))), { group: "baby-care" });

    expect(body).toContain('property="og:title" content="Shop NestaHub"');
  });
});

describe("who is sent to it", () => {
  const rules = vercel.rewrites as { source: string; destination: string; has?: { type: string; key: string; value: string }[] }[];
  const preview = rules.filter((r) => r.destination.startsWith("/api/shop"));
  const goes = (userAgent: string) => preview.every((r) => new RegExp(`^${r.has![0].value}$`).test(userAgent));

  it("covers groups and categories, ahead of the rule that catches everything", () => {
    expect(preview.map((r) => r.source)).toEqual(["/shop/:group", "/shop/:group/:category"]);
    expect(rules.indexOf(preview[1])).toBeLessThan(rules.findIndex((r) => r.destination === "/index.html"));
  });

  it.each([
    "WhatsApp/2.24.20.89 A",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0",
    "TelegramBot (like TwitterBot)",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ])("sends a preview app there: %s", (ua) => expect(goes(ua)).toBe(true));

  it.each([
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/490.0.0.0;]",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0",
  ])("never sends a shopper there: %s", (ua) => expect(goes(ua)).toBe(false));
});
