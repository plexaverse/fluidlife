import "server-only";
import prismadb from "./prismadb";
import { env } from "./env";
import { logger } from "./logger";

type EmailParams = { to: string; subject: string; html: string; text?: string };

async function sendEmail(p: EmailParams): Promise<{ ok: boolean; error?: string }> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return { ok: false, error: "RESEND not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.RESEND_FROM_EMAIL,
        to: p.to,
        subject: p.subject,
        html: p.html,
        ...(p.text && { text: p.text }),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${body.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Resend error" };
  }
}

async function sendSms(p: {
  phone: string;
  template: string;
  orderId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const key = env.TWO_FACTOR_AUTH_KEY;
  const baseUrl = env.TWO_FACTOR_BASE_URL;
  try {
    const url = `${baseUrl}/${key}/TRANS_SMS/AUTOGEN/${p.template}/${p.phone}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, error: `2Factor ${res.status}: ${body.slice(0, 200)}` };
    }
    const json = await res.json().catch(() => ({}));
    if (json.Status === "Error") {
      return { ok: false, error: json.Details ?? "2Factor error" };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "SMS error" };
  }
}

async function logSent(params: {
  channel: "email" | "sms";
  recipient: string;
  template: string;
  refType: string;
  refId: string;
  status: "sent" | "failed";
  error?: string;
}) {
  try {
    await prismadb.notificationLog.create({ data: params });
  } catch (e: any) {
    if (e?.code === "P2002") {
      // Already logged for this (channel, template, ref) — idempotent.
      return;
    }
    logger.error("[notify log]", e);
  }
}

// ── Public API ──────────────────────────────────────────────────────

export type OrderNotificationType =
  | "ORDER_CONFIRMED"
  | "ORDER_SHIPPED"
  | "ORDER_DELIVERED"
  | "ORDER_REFUNDED";

const SUBJECTS: Record<OrderNotificationType, string> = {
  ORDER_CONFIRMED: "Your Fluidlife order is confirmed",
  ORDER_SHIPPED: "Your Fluidlife order has shipped",
  ORDER_DELIVERED: "Your Fluidlife order was delivered",
  ORDER_REFUNDED: "Your Fluidlife refund has been issued",
};

function html(type: OrderNotificationType, order: { orderId: string; amount: any }): string {
  const amount = String(order.amount);
  const link = env.STORE_URL ? `${env.STORE_URL}/orders/${order.orderId}` : null;
  const body: Record<OrderNotificationType, string> = {
    ORDER_CONFIRMED: `<p>Thanks for your order <b>${order.orderId}</b>.</p><p>Total: ₹${amount}</p>`,
    ORDER_SHIPPED: `<p>Your order <b>${order.orderId}</b> is on its way.</p>`,
    ORDER_DELIVERED: `<p>Your order <b>${order.orderId}</b> has been delivered.</p>`,
    ORDER_REFUNDED: `<p>Refund issued for order <b>${order.orderId}</b>.</p>`,
  };
  const linkLine = link ? `<p><a href="${link}">View order</a></p>` : "";
  return `<div style="font-family:sans-serif">${body[type]}${linkLine}</div>`;
}

/**
 * Look up the order, send the appropriate channel(s), record in NotificationLog.
 * Idempotent: NotificationLog @@unique([channel, template, refType, refId]) prevents duplicates.
 */
export async function notifyOrderEvent(orderRef: string, type: OrderNotificationType): Promise<void> {
  const order = await prismadb.order.findUnique({
    where: { orderId: orderRef },
    select: {
      id: true,
      orderId: true,
      amount: true,
      user: { select: { email: true, phone: true, name: true } },
    },
  });
  if (!order) {
    logger.warn("[notify] order not found", { orderRef, type });
    return;
  }

  const email = order.user.email;
  if (email && !email.endsWith("@placeholder.fluidlife.local")) {
    const result = await sendEmail({
      to: email,
      subject: SUBJECTS[type],
      html: html(type, order),
    });
    await logSent({
      channel: "email",
      recipient: email,
      template: type,
      refType: "order",
      refId: order.id,
      status: result.ok ? "sent" : "failed",
      error: result.error,
    });
  }

  // SMS via 2Factor — template names must be pre-registered on DLT.
  const smsTemplateKey = `SMS_TEMPLATE_${type}` as keyof NodeJS.ProcessEnv;
  const smsTemplate = process.env[smsTemplateKey];
  const phone = order.user.phone;

  if (smsTemplate && phone) {
    const smsResult = await sendSms({ phone, template: smsTemplate, orderId: order.orderId });
    await logSent({
      channel: "sms",
      recipient: phone,
      template: type,
      refType: "order",
      refId: order.id,
      status: smsResult.ok ? "sent" : "failed",
      error: smsResult.error,
    });
  }
}
