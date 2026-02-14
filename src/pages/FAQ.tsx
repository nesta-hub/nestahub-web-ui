import { Layout } from "@/components/layout/Layout";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const faqSections = [
  {
    id: "orders",
    question: "How do I place an order?",
    answer:
      "You can place an order by browsing our catalogue, adding items to your cart, and proceeding to checkout. We accept various payment methods including bank transfer and card payments.",
  },
  {
    id: "delivery",
    question: "What are your delivery options?",
    answer:
      "We offer home delivery across Lagos and pickup from select stations. Delivery typically takes 1–3 business days within Lagos. For locations outside Lagos, please contact us for availability.",
  },
  {
    id: "bundles",
    question: "What are bundles and how do they work?",
    answer:
      "Bundles are curated sets of baby care essentials grouped by your baby's stage. You choose a stage, pick a tier, and we deliver everything your baby needs. Bundles offer better value than buying items individually.",
  },
  {
    id: "subscriptions",
    question: "How does the subscription service work?",
    answer:
      "Our auto-renew subscription delivers your favourite products on a schedule you choose — weekly, bi-weekly, or monthly. You save on every order and can pause, skip, or cancel anytime.",
  },
  {
    id: "returns",
    question: "What is your return policy?",
    answer:
      "We accept returns within 7 days of delivery for unopened and unused items in their original packaging. Please contact us via WhatsApp or email to initiate a return.",
  },
  {
    id: "payment",
    question: "What payment methods do you accept?",
    answer:
      "We accept bank transfers, debit/credit cards, and mobile payments. All transactions are processed securely. Payment details are provided at checkout.",
  },
  {
    id: "gifting",
    question: "Can I send a gift to someone?",
    answer:
      "Yes! Our gifting feature lets you send curated baby care bundles to new parents. You can add a personal message and choose from our beautifully packaged gift bundles.",
  },
  {
    id: "account",
    question: "Do I need an account to shop?",
    answer:
      "You can browse and shop as a guest, but creating an account lets you track orders, save your delivery address, and manage subscriptions more easily.",
  },
  {
    id: "products",
    question: "Are your products safe for newborns?",
    answer:
      "Absolutely. We only stock trusted, dermatologically tested brands that are safe for newborns and sensitive skin. Every product in our catalogue is carefully vetted.",
  },
  {
    id: "contact",
    question: "How can I reach customer support?",
    answer:
      "You can reach us via WhatsApp at 07081940881, call us directly, or email hello@nestahub.ng. Our team is available Monday to Saturday, 8 AM – 6 PM WAT.",
  },
  {
    id: "delete-account",
    question: "How do I delete my account or data?",
    answer:
      "To request account or data deletion, please send an email to privacy@nestahub.ng. Our team will process your request in accordance with our privacy policy and respond within 48 hours.",
  },
];

export default function FAQ() {
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      }
    }
  }, [location.hash]);

  return (
    <Layout>
      <div className={isMobile ? "px-4 py-6 max-w-lg mx-auto" : "max-w-3xl mx-auto px-6 py-16"}>
        <div className={isMobile ? "mb-6" : "text-center mb-12"}>
          {!isMobile && (
            <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
              Support
            </p>
          )}
          <h1 className={isMobile ? "text-2xl font-bold text-foreground" : "text-4xl font-bold text-foreground mb-4"}>
            Frequently Asked Questions
          </h1>
          {!isMobile && (
            <p className="text-muted-foreground max-w-xl mx-auto">
              Find quick answers to the most common questions about Nesta Hub.
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqSections.map((faq) => (
            <div key={faq.id} id={faq.id} className="scroll-mt-24">
              <AccordionItem
                value={faq.id}
                className="border border-border rounded-xl px-4 bg-card data-[state=open]:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="text-sm font-medium text-foreground">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>
    </Layout>
  );
}
