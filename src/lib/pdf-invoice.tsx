import "server-only";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
  Font,
} from "@react-pdf/renderer";
import type { buildInvoicePayload } from "./invoice";

type InvoicePayload = NonNullable<Awaited<ReturnType<typeof buildInvoicePayload>>>;

// Register a fallback font that ships with @react-pdf/renderer (no file needed).
Font.registerHyphenationCallback((word) => [word]);

const S = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 9, padding: 40, color: "#111" },
  row: { flexDirection: "row" },
  col: { flexDirection: "column" },
  spaceBetween: { justifyContent: "space-between" },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 16 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  label: { color: "#666" },
  mono: { fontFamily: "Courier" },
  // Section
  sectionTitle: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#666", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  addressBlock: { flex: 1 },
  // Table
  tableHeader: { flexDirection: "row", borderBottom: "2px solid #111", paddingBottom: 4, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", borderBottom: "0.5px solid #ddd", paddingVertical: 3 },
  // Totals
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsGrand: { flexDirection: "row", justifyContent: "space-between", borderTop: "2px solid #111", paddingTop: 4, marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 11 },
  // Footer
  footer: { borderTop: "0.5px solid #ccc", paddingTop: 8, marginTop: 16, fontSize: 8, color: "#888" },
  // Tax table
  taxHeader: { flexDirection: "row", borderBottom: "1px solid #aaa", paddingBottom: 2, marginBottom: 2, fontFamily: "Helvetica-Bold", fontSize: 7 },
  taxRow: { flexDirection: "row", fontSize: 7, paddingVertical: 1 },
});

function fmt(n: number | string): string {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function Col({ w, children, right }: { w: number | string; children: React.ReactNode; right?: boolean }) {
  return (
    <View style={{ width: w as any, textAlign: right ? "right" : "left" }}>
      <Text>{children as any}</Text>
    </View>
  );
}

function InvoiceDocument({ inv }: { inv: InvoicePayload }) {
  const { invoice, seller, buyer, items, totals, taxBreakup } = inv;
  const tb = taxBreakup as any;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Header */}
        <View style={S.header}>
          <View>
            <Text style={S.h1}>{seller.name ?? "Tax Invoice"}</Text>
            {seller.address && <Text>{seller.address}</Text>}
            {seller.state && <Text>{seller.state}{seller.pincode ? ` — ${seller.pincode}` : ""}</Text>}
            {seller.phone && <Text>{seller.phone}</Text>}
            {seller.email && <Text>{seller.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={S.h2}>TAX INVOICE</Text>
            <View style={{ marginTop: 6 }}>
              <Text><Text style={S.label}>No.  </Text><Text style={S.mono}>{invoice.number ?? "—"}</Text></Text>
              <Text>
                <Text style={S.label}>Date  </Text>
                {new Date(invoice.issuedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
              </Text>
              <Text><Text style={S.label}>Order  </Text><Text style={S.mono}>{invoice.orderId}</Text></Text>
              {seller.gstin && <Text style={{ marginTop: 4 }}><Text style={S.label}>GSTIN  </Text>{seller.gstin}</Text>}
              {seller.pan && <Text><Text style={S.label}>PAN  </Text>{seller.pan}</Text>}
            </View>
          </View>
        </View>

        {/* Bill to / Ship to */}
        <View style={[S.row, { marginBottom: 16 }]}>
          <View style={[S.addressBlock, { marginRight: 24 }]}>
            <Text style={S.sectionTitle}>Bill to</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{buyer.companyName || buyer.name}</Text>
            {buyer.companyName && buyer.companyName !== buyer.name && <Text>{buyer.name}</Text>}
            <Text>{buyer.phone}</Text>
            <Text>{buyer.email}</Text>
            {buyer.gstNumber && <Text style={{ marginTop: 2 }}>GSTIN: {buyer.gstNumber}</Text>}
          </View>
          <View style={S.addressBlock}>
            <Text style={S.sectionTitle}>Ship to</Text>
            <Text>{buyer.address.address1}</Text>
            {buyer.address.address2 && <Text>{buyer.address.address2}</Text>}
            {buyer.address.landmark && <Text>Near {buyer.address.landmark}</Text>}
            <Text>{buyer.address.city}, {buyer.address.state} — {buyer.address.pincode}</Text>
            <Text>{buyer.address.country}</Text>
          </View>
        </View>

        {/* Items table */}
        <View style={S.tableHeader}>
          <Col w="35%">Description</Col>
          <Col w="12%">HSN</Col>
          <Col w="8%" right>Qty</Col>
          <Col w="15%" right>Rate</Col>
          <Col w="10%" right>GST%</Col>
          <Col w="20%" right>Amount</Col>
        </View>
        {items.map((it, i) => (
          <View key={i} style={S.tableRow}>
            <Col w="35%">{it.name}</Col>
            <Col w="12%">{it.hsnCode || "—"}</Col>
            <Col w="8%" right>{it.quantity}</Col>
            <Col w="15%" right>{fmt(it.unitPrice)}</Col>
            <Col w="10%" right>{it.gstRate}%</Col>
            <Col w="20%" right>{fmt(it.lineTotal)}</Col>
          </View>
        ))}

        {/* Totals */}
        <View style={{ alignItems: "flex-end", marginTop: 12 }}>
          <View style={{ width: "45%" }}>
            <View style={S.totalsRow}>
              <Text style={S.label}>Subtotal (incl. GST)</Text>
              <Text>{fmt(totals.subtotal)}</Text>
            </View>
            {Number(totals.discount) > 0 && (
              <View style={S.totalsRow}>
                <Text style={S.label}>Discount{totals.coupon ? ` (${totals.coupon})` : ""}</Text>
                <Text>−{fmt(totals.discount)}</Text>
              </View>
            )}
            {Number(totals.delivery) > 0 && (
              <View style={S.totalsRow}>
                <Text style={S.label}>Delivery</Text>
                <Text>{fmt(totals.delivery)}</Text>
              </View>
            )}
            <View style={S.totalsRow}>
              <Text style={S.label}>GST extracted</Text>
              <Text>{fmt(totals.tax)}</Text>
            </View>
            <View style={S.totalsGrand}>
              <Text>Grand total</Text>
              <Text>{fmt(totals.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Tax breakup */}
        {tb?.lines && tb.lines.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={S.sectionTitle}>
              Tax breakup — {tb.interState ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)"}
            </Text>
            <View style={S.taxHeader}>
              {["HSN", "Rate", "Taxable", "CGST", "SGST", "IGST"].map((h) => (
                <Col key={h} w="16.6%">{h}</Col>
              ))}
            </View>
            {tb.lines.map((l: any, i: number) => (
              <View key={i} style={S.taxRow}>
                <Col w="16.6%">{l.hsnCode || "—"}</Col>
                <Col w="16.6%">{l.rate}%</Col>
                <Col w="16.6%">₹{l.taxable}</Col>
                <Col w="16.6%">₹{l.cgst}</Col>
                <Col w="16.6%">₹{l.sgst}</Col>
                <Col w="16.6%">₹{l.igst}</Col>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={S.footer}>
          <Text>This is a computer-generated invoice and does not require a signature.</Text>
          <Text style={{ marginTop: 2 }}>Payment type: {invoice.paymentType}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(inv: InvoicePayload): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument inv={inv} />);
}
