import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  // ─── Required at request time ──────────────────────────────────────
  get JWT_SECRET() {
    return required("JWT_SECRET");
  },
  get ADMIN_USERNAME() {
    return required("ADMIN_USERNAME");
  },
  get ADMIN_PASSWORD() {
    return required("ADMIN_PASSWORD");
  },
  get USER_ACCESS_SECRET() {
    return required("USER_ACCESS_SECRET");
  },
  get USER_REFRESH_SECRET() {
    return required("USER_REFRESH_SECRET");
  },
  get TWO_FACTOR_BASE_URL() {
    return required("TWO_FACTOR_BASE_URL");
  },
  get TWO_FACTOR_AUTH_KEY() {
    return required("TWO_FACTOR_AUTH_KEY");
  },
  get RAZORPAY_WEBHOOK_SECRET() {
    return required("RAZORPAY_WEBHOOK_SECRET");
  },
  get SHIPROCKET_WEBHOOK_TOKEN() {
    return required("SHIPROCKET_WEBHOOK_TOKEN");
  },
  get UPSTASH_REDIS_REST_URL() {
    return required("UPSTASH_REDIS_REST_URL");
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return required("UPSTASH_REDIS_REST_TOKEN");
  },

  // ─── Optional ─────────────────────────────────────────────────────
  get ALLOWED_ORIGINS(): string[] {
    return (process.env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  },

  // Razorpay (for refunds + reconciliation; webhook only needs the secret above)
  get RAZORPAY_KEY_ID() {
    return optional("RAZORPAY_KEY_ID");
  },
  get RAZORPAY_KEY_SECRET() {
    return optional("RAZORPAY_KEY_SECRET");
  },

  // Notifications
  get RESEND_API_KEY() {
    return optional("RESEND_API_KEY");
  },
  get RESEND_FROM_EMAIL() {
    return optional("RESEND_FROM_EMAIL");
  },
  get STORE_URL() {
    return optional("STORE_URL");
  },

  // Seller info (for GST-compliant invoices)
  get SELLER(): {
    name?: string;
    gstin?: string;
    pan?: string;
    address?: string;
    state?: string;
    pincode?: string;
    email?: string;
    phone?: string;
  } {
    return {
      name: optional("SELLER_NAME"),
      gstin: optional("SELLER_GSTIN"),
      pan: optional("SELLER_PAN"),
      address: optional("SELLER_ADDRESS"),
      state: optional("SELLER_STATE"),
      pincode: optional("SELLER_PINCODE"),
      email: optional("SELLER_EMAIL"),
      phone: optional("SELLER_PHONE"),
    };
  },

  // Numeric tunables
  get FREE_SHIPPING_THRESHOLD(): number {
    return Number(process.env.FREE_SHIPPING_THRESHOLD ?? "0");
  },
  get PAYMENT_EXPIRY_MINUTES(): number {
    const n = Number(process.env.PAYMENT_EXPIRY_MINUTES ?? "15");
    return Number.isFinite(n) && n > 0 ? n : 15;
  },
};
