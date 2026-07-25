declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq(...args);
  }
}

export const metaPixel = {
  pageView() {
    fbq('track', 'PageView', {
      page_path: window.location.pathname,
      page_location: window.location.href,
    });
  },

  viewContent(params: {
    content_name: string;
    content_ids?: string[];
    content_type?: string;
    value?: number;
    currency?: string;
  }) {
    fbq('track', 'ViewContent', params);
  },

  addToCart(params: {
    content_name: string;
    content_ids: string[];
    value: number;
    currency: string;
    num_items?: number;
  }) {
    fbq('track', 'AddToCart', params);
  },

  initiateCheckout(params: {
    num_items: number;
    value: number;
    currency: string;
  }) {
    fbq('track', 'InitiateCheckout', params);
  },

  purchase(params: {
    value: number;
    currency: string;
    num_items?: number;
    order_id?: string;
  }) {
    fbq('track', 'Purchase', params);
  },

  lead(params?: { content_name?: string }) {
    fbq('track', 'Lead', params ?? {});
  },

  search(params: { search_string: string }) {
    fbq('track', 'Search', params);
  },

  customEvent(name: string, params?: Record<string, unknown>) {
    fbq('trackCustom', name, params ?? {});
  },
};
