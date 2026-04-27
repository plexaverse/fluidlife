import "server-only";
import { Prisma } from "@prisma/client";

/**
 * Convention: `Product.price` is GST-INCLUSIVE (the listed price the customer
 * sees). Same applies to `b2bPrice`. We extract the GST component from the
 * gross amount for the invoice / books.
 *
 *   gross    = price × qty
 *   net      = gross / (1 + rate/100)
 *   gstTotal = gross − net
 *
 * For an inter-state shipment (seller state ≠ buyer state), the entire GST
 * is IGST. For an intra-state shipment, it's split equally between CGST + SGST.
 */

const TWO = new Prisma.Decimal(2);
const HUNDRED = new Prisma.Decimal(100);

export type TaxLine = {
  productId: string;
  hsnCode: string | null;
  rate: Prisma.Decimal;       // e.g. 18
  taxable: Prisma.Decimal;     // net (gross / (1 + rate/100))
  gst: Prisma.Decimal;         // gross − net
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
};

export function computeTaxLine(input: {
  productId: string;
  hsnCode: string | null;
  rate: Prisma.Decimal | number | string;
  grossAmount: Prisma.Decimal;
  interState: boolean;
}): TaxLine {
  const rate = new Prisma.Decimal(input.rate);
  const denom = HUNDRED.plus(rate).div(HUNDRED); // (100 + rate)/100
  const taxable = input.grossAmount.div(denom);
  const gst = input.grossAmount.minus(taxable);
  const igst = input.interState ? gst : new Prisma.Decimal(0);
  const half = input.interState ? new Prisma.Decimal(0) : gst.div(TWO);
  return {
    productId: input.productId,
    hsnCode: input.hsnCode,
    rate,
    taxable,
    gst,
    cgst: half,
    sgst: half,
    igst,
  };
}

export function summarizeTax(lines: TaxLine[]): {
  taxable: Prisma.Decimal;
  gst: Prisma.Decimal;
  cgst: Prisma.Decimal;
  sgst: Prisma.Decimal;
  igst: Prisma.Decimal;
} {
  const zero = new Prisma.Decimal(0);
  return lines.reduce(
    (acc, l) => ({
      taxable: acc.taxable.plus(l.taxable),
      gst: acc.gst.plus(l.gst),
      cgst: acc.cgst.plus(l.cgst),
      sgst: acc.sgst.plus(l.sgst),
      igst: acc.igst.plus(l.igst),
    }),
    { taxable: zero, gst: zero, cgst: zero, sgst: zero, igst: zero }
  );
}

/** Normalize state strings for comparison. Conservative: trim + uppercase. */
export function isInterState(sellerState: string | undefined, buyerState: string): boolean {
  if (!sellerState) return true; // unknown → safe default (charge IGST)
  return sellerState.trim().toUpperCase() !== buyerState.trim().toUpperCase();
}
