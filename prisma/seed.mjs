/**
 * Idempotent seed for pre-launch dummy catalog data.
 *
 *  - 3 billboards (one per landing strip)
 *  - 4 categories
 *  - 6 products (3 featured) with images + a sample review each
 *
 * Re-run safe: every row is `upsert`ed by a deterministic UUID so running
 * this twice doesn't duplicate or fail.
 *
 * Run with: `npm run db:seed` (which calls `node prisma/seed.mjs`).
 *
 * NOTE: mirrors the runtime DB setup in src/lib/prismadb.ts — opens its own
 * pg.Pool through @prisma/adapter-pg. Uses DIRECT_URL ?? DATABASE_URL so
 * Supabase users can route DDL/heavy writes through the direct connection.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

try {
  process.loadEnvFile?.();
} catch {
  /* .env absent — env may be injected by the shell */
}

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL / DIRECT_URL not set — cannot seed.");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Deterministic UUIDs ─────────────────────────────────────────────────
const BILLBOARD = {
  skincare: "11111111-1111-1111-1111-000000000001",
  hygiene: "11111111-1111-1111-1111-000000000002",
  wellness: "11111111-1111-1111-1111-000000000003",
};

const CATEGORY = {
  skincare: "22222222-2222-2222-2222-000000000001",
  bodyCare: "22222222-2222-2222-2222-000000000002",
  hairCare: "22222222-2222-2222-2222-000000000003",
  wellness: "22222222-2222-2222-2222-000000000004",
};

const PRODUCT = {
  serum: "33333333-3333-3333-3333-000000000001",
  vitC: "33333333-3333-3333-3333-000000000002",
  bodyWash: "33333333-3333-3333-3333-000000000003",
  hairOil: "33333333-3333-3333-3333-000000000004",
  conditioner: "33333333-3333-3333-3333-000000000005",
  tonic: "33333333-3333-3333-3333-000000000006",
};

// Unsplash CDN — already added to next.config remotePatterns. The `?w=900&q=80`
// query keeps download size sane.
const img = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;

const billboards = [
  {
    id: BILLBOARD.skincare,
    label: "Glow you can feel",
    imageUrl: img("1556228720-195a672e8a03"),
  },
  {
    id: BILLBOARD.hygiene,
    label: "Everyday essentials",
    imageUrl: img("1556228852-80b6e5eeff06"),
  },
  {
    id: BILLBOARD.wellness,
    label: "Wellness for all",
    imageUrl: img("1571781926291-c477ebfd024b"),
  },
];

const categories = [
  { id: CATEGORY.skincare, name: "Skincare", billboardId: BILLBOARD.skincare },
  { id: CATEGORY.bodyCare, name: "Body Care", billboardId: BILLBOARD.hygiene },
  { id: CATEGORY.hairCare, name: "Hair Care", billboardId: BILLBOARD.hygiene },
  { id: CATEGORY.wellness, name: "Wellness", billboardId: BILLBOARD.wellness },
];

const products = [
  {
    id: PRODUCT.serum,
    categoryId: CATEGORY.skincare,
    name: "Hydrating Face Serum",
    description:
      "A featherweight hyaluronic-acid serum that locks in moisture for up to 24 hours. Dermatologist-tested, suitable for all skin types.",
    features: ["Hyaluronic acid 2%", "Niacinamide", "Fragrance-free"],
    benefits: ["Plumps fine lines", "Deep hydration", "Brightens dull skin"],
    usage: ["Apply 2–3 drops AM and PM on cleansed skin"],
    idealFor: ["Dry skin", "Mature skin", "Sensitive skin"],
    reasonsToBuy: ["Clinically tested", "Vegan", "Cruelty-free"],
    sustainable: ["Glass bottle", "Recyclable cap"],
    certifications: ["Made Safe", "Cruelty Free International"],
    price: "699",
    originalPrice: "899",
    gstRate: "18",
    hsnCode: "3304",
    stock: 120,
    isFeatured: true,
    images: ["1556228578-8c89e6adf883", "1556228720-195a672e8a03"],
    review: { rating: 5, comment: "Skin felt soft from week one.", author: "Anika S." },
  },
  {
    id: PRODUCT.vitC,
    categoryId: CATEGORY.skincare,
    name: "Glow Vitamin C Cream",
    description:
      "Stabilised 10% vitamin C in a velvety cream base. Evens skin tone and fights early signs of dullness without irritation.",
    features: ["10% Ethyl Ascorbic Acid", "Vitamin E", "Light citrus scent"],
    benefits: ["Brightens", "Evens tone", "Boosts collagen"],
    usage: ["Pea-size amount each morning before sunscreen"],
    idealFor: ["Dull skin", "Uneven tone"],
    reasonsToBuy: ["Stable vitamin C", "Non-sticky"],
    sustainable: ["Recyclable jar"],
    certifications: ["Dermatologically tested"],
    price: "899",
    originalPrice: "1099",
    gstRate: "18",
    hsnCode: "3304",
    stock: 80,
    isFeatured: true,
    images: ["1599305445671-ac291c95aaa9", "1612817288484-6f916006741a"],
    review: { rating: 4, comment: "Noticed a glow within 2 weeks.", author: "Rohan K." },
  },
  {
    id: PRODUCT.bodyWash,
    categoryId: CATEGORY.bodyCare,
    name: "Gentle Body Wash",
    description:
      "Sulfate-free body wash with coconut-derived cleansers and aloe. Rinses clean without stripping moisture.",
    features: ["Sulfate-free", "pH balanced", "Light coconut scent"],
    benefits: ["Moisturising", "Soothes dry skin"],
    usage: ["Lather onto wet skin in the shower, rinse"],
    idealFor: ["Daily use", "Sensitive skin"],
    reasonsToBuy: ["Family-safe", "Biodegradable"],
    sustainable: ["100% recycled bottle"],
    certifications: ["Cruelty Free"],
    price: "399",
    originalPrice: "499",
    gstRate: "18",
    hsnCode: "3401",
    stock: 200,
    isFeatured: false,
    images: ["1556228578-0d85b1a4d571", "1571875257727-256c39da42af"],
    review: { rating: 5, comment: "Smells amazing, lasts forever.", author: "Meera J." },
  },
  {
    id: PRODUCT.hairOil,
    categoryId: CATEGORY.hairCare,
    name: "Natural Hair Oil",
    description:
      "A non-greasy ayurvedic blend of bhringraj, amla and coconut. Nourishes the scalp and reduces breakage.",
    features: ["Bhringraj", "Amla", "Cold-pressed coconut"],
    benefits: ["Reduces hair fall", "Strengthens roots", "Adds shine"],
    usage: ["Massage into scalp, leave 30 min, wash out"],
    idealFor: ["Dry hair", "Hair fall"],
    reasonsToBuy: ["Ayurvedic formula", "No mineral oil"],
    sustainable: ["Glass bottle"],
    certifications: ["Ayush approved"],
    price: "549",
    originalPrice: "699",
    gstRate: "18",
    hsnCode: "3305",
    stock: 150,
    isFeatured: true,
    images: ["1571877227200-a0d98ea607e9", "1620916566398-39f1143ab7be"],
    review: { rating: 5, comment: "Less hair fall after a month.", author: "Priya N." },
  },
  {
    id: PRODUCT.conditioner,
    categoryId: CATEGORY.hairCare,
    name: "Daily Hair Conditioner",
    description:
      "Detangles and softens with argan oil and silk protein. Lightweight enough for everyday use.",
    features: ["Argan oil", "Silk protein", "Silicone-free"],
    benefits: ["Detangles instantly", "Adds silkiness"],
    usage: ["Apply mid-length to ends after shampoo, rinse"],
    idealFor: ["Frizzy hair", "Daily wash"],
    reasonsToBuy: ["Salon-grade ingredients"],
    sustainable: ["Recyclable tube"],
    certifications: ["Cruelty Free"],
    price: "449",
    originalPrice: "549",
    gstRate: "18",
    hsnCode: "3305",
    stock: 90,
    isFeatured: false,
    images: ["1559757148-5c350d0d3c56", "1559599101-f09722fb4948"],
    review: { rating: 4, comment: "Detangles like a dream.", author: "Ishaan P." },
  },
  {
    id: PRODUCT.tonic,
    categoryId: CATEGORY.wellness,
    name: "Immunity Boost Tonic",
    description:
      "A daily wellness shot with turmeric, ginger and amla. Sugar-free and naturally tangy.",
    features: ["Turmeric", "Ginger", "Amla", "Sugar-free"],
    benefits: ["Supports immunity", "Aids digestion"],
    usage: ["10 ml on empty stomach, dilute with warm water"],
    idealFor: ["Daily wellness routine"],
    reasonsToBuy: ["No preservatives", "Ayurvedic"],
    sustainable: ["Glass bottle"],
    certifications: ["FSSAI"],
    price: "999",
    originalPrice: "1199",
    gstRate: "5",
    hsnCode: "3004",
    stock: 60,
    isFeatured: false,
    images: ["1556760544-74068565f05c", "1610632380989-680fe40816c6"],
    review: { rating: 4, comment: "Tastes earthy but works.", author: "Aarav D." },
  },
];

async function main() {
  console.log("→ Seeding billboards…");
  for (const b of billboards) {
    await prisma.billboard.upsert({
      where: { id: b.id },
      create: b,
      update: { label: b.label, imageUrl: b.imageUrl },
    });
  }

  console.log("→ Seeding categories…");
  for (const c of categories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: c,
      update: { name: c.name, billboardId: c.billboardId },
    });
  }

  console.log("→ Seeding products…");
  for (const p of products) {
    const { images, review, ...productData } = p;

    await prisma.product.upsert({
      where: { id: p.id },
      create: productData,
      update: {
        categoryId: productData.categoryId,
        name: productData.name,
        description: productData.description,
        features: productData.features,
        benefits: productData.benefits,
        usage: productData.usage,
        idealFor: productData.idealFor,
        reasonsToBuy: productData.reasonsToBuy,
        sustainable: productData.sustainable,
        certifications: productData.certifications,
        price: productData.price,
        originalPrice: productData.originalPrice,
        gstRate: productData.gstRate,
        hsnCode: productData.hsnCode,
        stock: productData.stock,
        isFeatured: productData.isFeatured,
      },
    });

    // Reset images for this product (small list, so wipe-and-recreate is
    // fine and keeps re-runs idempotent without juggling unique keys).
    await prisma.image.deleteMany({ where: { productId: p.id } });
    await prisma.image.createMany({
      data: images.map((unsplashId) => ({
        productId: p.id,
        url: img(unsplashId),
      })),
    });

    // One anonymous (guest) review per product. Deterministic id keeps it
    // upsertable; userId stays null so it shows the customerName instead.
    const reviewId = `44444444-4444-4444-4444-${p.id.slice(-12)}`;
    await prisma.review.upsert({
      where: { id: reviewId },
      create: {
        id: reviewId,
        productId: p.id,
        userId: null,
        customerName: review.author,
        rating: review.rating,
        comment: review.comment,
      },
      update: {
        customerName: review.author,
        rating: review.rating,
        comment: review.comment,
      },
    });
  }

  console.log("✓ Seed complete.");
}

main()
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
