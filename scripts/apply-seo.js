#!/usr/bin/env node
/**
 * Generates everything in the public site's SEO that depends on the production
 * domain, so no domain is ever guessed or hard-coded:
 *
 *   - canonical / og:url / og:image / twitter:image + JSON-LD  -> index.html (between the SEO:BEGIN/END markers)
 *   - robots.txt                                                -> repo root
 *   - sitemap.xml                                               -> repo root (only when a domain is given)
 *
 * Usage:
 *   npm run seo -- --url https://your-real-domain.example
 *   SITE_URL=https://your-real-domain.example npm run seo
 *   npm run seo                     (no domain: emits domain-free markup only — no canonical, no sitemap)
 *   npm run seo -- --url https://x.example --out ./tmp   (write robots/sitemap/index.html copy elsewhere to inspect)
 *
 * Business facts (name, address, phone, hours) come from seo/business.json and
 * mirror what index.html already shows. Nothing is invented: a field that is
 * empty in that file is simply left out of the structured data.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);
const argValue = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

function normaliseOrigin(raw) {
  if (!raw) return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`Not a valid URL: ${raw}`);
  }
  if (url.protocol !== "https:") throw new Error("The production site URL must use https://");
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname) || !url.hostname.includes(".")) {
    throw new Error(`Refusing a local/private host in SEO output: ${url.hostname}`);
  }
  return url.origin; // scheme + host (+port), no trailing slash, no path
}

const origin = normaliseOrigin(argValue("--url") || process.env.SITE_URL);
const outDir = argValue("--out") ? path.resolve(argValue("--out")) : root;
fs.mkdirSync(outDir, { recursive: true });

const business = JSON.parse(fs.readFileSync(path.join(root, "seo", "business.json"), "utf8"));
const abs = (p) => `${origin}/${String(p).replace(/^\//, "")}`;

// ---------------------------------------------------------------- JSON-LD ---
const restaurant = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  ...(origin ? { "@id": `${origin}/#restaurant`, url: `${origin}/` } : {}),
  name: business.name,
  description: business.description,
  ...(origin ? { image: abs(business.image), logo: abs(business.logo) } : {}),
  telephone: business.telephone[0],
  address: { "@type": "PostalAddress", ...business.address },
  servesCuisine: business.servesCuisine,
  openingHoursSpecification: business.openingHours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.dayOfWeek,
    opens: h.opens,
    closes: h.closes,
  })),
  ...(origin ? { hasMenu: `${origin}/#menu`, acceptsReservations: `${origin}/#reservations` } : { acceptsReservations: true }),
  ...(business.sameAs && business.sameAs.length ? { sameAs: business.sameAs } : {}),
};
const website = origin
  ? { "@context": "https://schema.org", "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: business.name }
  : null;

const ldJson = (obj) =>
  `<script type="application/ld+json">\n${JSON.stringify(obj, null, 2).replace(/</g, "\\u003c")}\n</script>`;

// ------------------------------------------------------------- HTML block ---
const lines = [];
if (origin) {
  lines.push(`<link rel="canonical" href="${origin}/" />`);
  lines.push(`<meta property="og:url" content="${origin}/" />`);
  lines.push(`<meta property="og:image" content="${abs(business.image)}" />`);
  lines.push(`<meta property="og:image:width" content="1200" />`);
  lines.push(`<meta property="og:image:height" content="630" />`);
  lines.push(`<meta property="og:image:alt" content="Outdoor dining area at Grill Out, Haripur, with tables set under string lights" />`);
  lines.push(`<meta name="twitter:image" content="${abs(business.image)}" />`);
  lines.push(`<meta name="twitter:image:alt" content="Outdoor dining area at Grill Out, Haripur, with tables set under string lights" />`);
}
lines.push(ldJson(restaurant));
if (website) lines.push(ldJson(website));

const BEGIN = /<!-- SEO:BEGIN[\s\S]*?-->/;
const END = "<!-- SEO:END -->";
const indexPath = path.join(root, "index.html");
let html = fs.readFileSync(indexPath, "utf8");
const b = html.match(BEGIN);
const e = html.indexOf(END);
if (!b || e < 0) throw new Error("SEO:BEGIN / SEO:END markers not found in index.html");
html = html.slice(0, b.index + b[0].length) + "\n" + lines.join("\n") + "\n" + html.slice(e);
fs.writeFileSync(path.join(outDir, "index.html"), html);

// -------------------------------------------------------------- robots.txt ---
const robots = [
  "# Public pages are crawlable. The admin dashboard and API are private and",
  "# also protected by authentication + noindex headers (robots.txt is not security).",
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin/",
  "Disallow: /api/",
  "Disallow: /internal/",
  "",
  ...(origin ? [`Sitemap: ${origin}/sitemap.xml`, ""] : []),
].join("\n");
fs.writeFileSync(path.join(outDir, "robots.txt"), robots);

// ------------------------------------------------------------- sitemap.xml ---
const sitemapPath = path.join(outDir, "sitemap.xml");
if (origin) {
  const lastmod = fs.statSync(indexPath).mtime.toISOString().slice(0, 10);
  const urls = business.pages
    .map(
      (p) =>
        `  <url>\n    <loc>${origin}${p.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    )
    .join("\n");
  fs.writeFileSync(
    sitemapPath,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
} else if (fs.existsSync(sitemapPath) && outDir === root) {
  console.warn("No domain given: leaving any existing sitemap.xml untouched.");
}

console.log(
  origin
    ? `SEO files written for ${origin} -> ${outDir}`
    : "No production domain given: wrote domain-free markup + robots.txt only. Run `npm run seo -- --url https://<domain>` before deploying."
);
