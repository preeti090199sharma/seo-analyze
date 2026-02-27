"use client";

import { useState } from "react";

type SchemaType = "Article" | "LocalBusiness" | "Product" | "FAQ" | "Organization" | "BreadcrumbList";

interface FAQItem { question: string; answer: string; }
interface BreadcrumbItem { name: string; url: string; }

const schemaTypes: { value: SchemaType; label: string; icon: string }[] = [
  { value: "Article", label: "Article / Blog Post", icon: "📰" },
  { value: "LocalBusiness", label: "Local Business", icon: "🏪" },
  { value: "Product", label: "Product", icon: "🛒" },
  { value: "FAQ", label: "FAQ Page", icon: "❓" },
  { value: "Organization", label: "Organization", icon: "🏢" },
  { value: "BreadcrumbList", label: "Breadcrumb", icon: "🔗" },
];

function buildSchema(type: SchemaType, fields: Record<string, string>, faqItems: FAQItem[], breadcrumbs: BreadcrumbItem[]) {
  switch (type) {
    case "Article":
      return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: fields.headline || undefined,
        description: fields.description || undefined,
        image: fields.image || undefined,
        author: fields.author ? { "@type": "Person", name: fields.author } : undefined,
        publisher: fields.publisher ? { "@type": "Organization", name: fields.publisher, logo: fields.publisherLogo ? { "@type": "ImageObject", url: fields.publisherLogo } : undefined } : undefined,
        datePublished: fields.datePublished || undefined,
        dateModified: fields.dateModified || undefined,
        url: fields.url || undefined,
      };
    case "LocalBusiness":
      return {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: fields.name || undefined,
        description: fields.description || undefined,
        image: fields.image || undefined,
        telephone: fields.telephone || undefined,
        email: fields.email || undefined,
        url: fields.url || undefined,
        address: fields.street ? { "@type": "PostalAddress", streetAddress: fields.street, addressLocality: fields.city, addressRegion: fields.state, postalCode: fields.zip, addressCountry: fields.country } : undefined,
        geo: fields.lat ? { "@type": "GeoCoordinates", latitude: fields.lat, longitude: fields.lng } : undefined,
        openingHours: fields.hours || undefined,
        priceRange: fields.priceRange || undefined,
      };
    case "Product":
      return {
        "@context": "https://schema.org",
        "@type": "Product",
        name: fields.name || undefined,
        description: fields.description || undefined,
        image: fields.image || undefined,
        brand: fields.brand ? { "@type": "Brand", name: fields.brand } : undefined,
        sku: fields.sku || undefined,
        offers: {
          "@type": "Offer",
          price: fields.price || undefined,
          priceCurrency: fields.currency || "USD",
          availability: fields.availability || "https://schema.org/InStock",
          url: fields.url || undefined,
        },
        aggregateRating: fields.ratingValue ? { "@type": "AggregateRating", ratingValue: fields.ratingValue, reviewCount: fields.reviewCount } : undefined,
      };
    case "FAQ":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.filter(f => f.question && f.answer).map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      };
    case "Organization":
      return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: fields.name || undefined,
        url: fields.url || undefined,
        logo: fields.logo || undefined,
        description: fields.description || undefined,
        email: fields.email || undefined,
        telephone: fields.telephone || undefined,
        sameAs: fields.sameAs ? fields.sameAs.split(",").map(s => s.trim()) : undefined,
      };
    case "BreadcrumbList":
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbs.filter(b => b.name && b.url).map((b, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: b.name,
          item: b.url,
        })),
      };
  }
}

function cleanObj(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(cleanObj).filter(v => v !== undefined);
  if (obj && typeof obj === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const cv = cleanObj(v);
      if (cv !== undefined && cv !== "" && cv !== null) cleaned[k] = cv;
    }
    return Object.keys(cleaned).length ? cleaned : undefined;
  }
  return obj;
}

export default function SchemaGeneratorPage() {
  const [type, setType] = useState<SchemaType>("Article");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [faqItems, setFaqItems] = useState<FAQItem[]>([{ question: "", answer: "" }]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ name: "", url: "" }]);
  const [copied, setCopied] = useState(false);

  const setField = (key: string, val: string) => setFields(prev => ({ ...prev, [key]: val }));

  const schema = cleanObj(buildSchema(type, fields, faqItems, breadcrumbs));
  const jsonOutput = JSON.stringify(schema, null, 2);
  const scriptTag = `<script type="application/ld+json">\n${jsonOutput}\n</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Input = ({ label, field, placeholder }: { label: string; field: string; placeholder: string }) => (
    <div>
      <label className="text-xs font-medium text-slate-400 mb-1 block">{label}</label>
      <input
        type="text"
        value={fields[field] || ""}
        onChange={(e) => setField(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-2">🧩 Schema Markup Generator</h1>
      <p className="text-slate-400 mb-8">Generate valid JSON-LD structured data for Google Rich Results. 100% accurate output.</p>

      {/* Schema Type Selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {schemaTypes.map((s) => (
          <button
            key={s.value}
            onClick={() => { setType(s.value); setFields({}); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === s.value ? "bg-indigo-500 text-white" : "glass text-slate-300 hover:text-white"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          {type === "Article" && (
            <>
              <Input label="Headline" field="headline" placeholder="How to Improve Your SEO" />
              <Input label="Description" field="description" placeholder="A comprehensive guide..." />
              <Input label="Image URL" field="image" placeholder="https://example.com/image.jpg" />
              <Input label="Author Name" field="author" placeholder="John Doe" />
              <Input label="Publisher Name" field="publisher" placeholder="My Website" />
              <Input label="Publisher Logo URL" field="publisherLogo" placeholder="https://example.com/logo.png" />
              <Input label="Date Published" field="datePublished" placeholder="2026-01-15" />
              <Input label="Date Modified" field="dateModified" placeholder="2026-02-28" />
              <Input label="URL" field="url" placeholder="https://example.com/article" />
            </>
          )}
          {type === "LocalBusiness" && (
            <>
              <Input label="Business Name" field="name" placeholder="My Coffee Shop" />
              <Input label="Description" field="description" placeholder="Best coffee in town" />
              <Input label="Phone" field="telephone" placeholder="+1-234-567-8900" />
              <Input label="Email" field="email" placeholder="info@example.com" />
              <Input label="Website" field="url" placeholder="https://example.com" />
              <Input label="Street Address" field="street" placeholder="123 Main St" />
              <Input label="City" field="city" placeholder="New York" />
              <Input label="State" field="state" placeholder="NY" />
              <Input label="ZIP Code" field="zip" placeholder="10001" />
              <Input label="Country" field="country" placeholder="US" />
              <Input label="Image" field="image" placeholder="https://example.com/store.jpg" />
              <Input label="Price Range" field="priceRange" placeholder="$$" />
              <Input label="Opening Hours" field="hours" placeholder="Mo-Fr 09:00-17:00" />
            </>
          )}
          {type === "Product" && (
            <>
              <Input label="Product Name" field="name" placeholder="Wireless Headphones" />
              <Input label="Description" field="description" placeholder="Premium noise-cancelling..." />
              <Input label="Image" field="image" placeholder="https://example.com/product.jpg" />
              <Input label="Brand" field="brand" placeholder="BrandName" />
              <Input label="SKU" field="sku" placeholder="WH-1000XM5" />
              <Input label="Price" field="price" placeholder="299.99" />
              <Input label="Currency" field="currency" placeholder="USD" />
              <Input label="URL" field="url" placeholder="https://example.com/product" />
              <Input label="Rating (1-5)" field="ratingValue" placeholder="4.5" />
              <Input label="Review Count" field="reviewCount" placeholder="128" />
            </>
          )}
          {type === "FAQ" && (
            <div className="space-y-4">
              {faqItems.map((item, i) => (
                <div key={i} className="glass rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-400">Question {i + 1}</span>
                    {faqItems.length > 1 && (
                      <button onClick={() => setFaqItems(prev => prev.filter((_, j) => j !== i))} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={item.question}
                    onChange={(e) => { const n = [...faqItems]; n[i].question = e.target.value; setFaqItems(n); }}
                    placeholder="What is SEO?"
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    value={item.answer}
                    onChange={(e) => { const n = [...faqItems]; n[i].answer = e.target.value; setFaqItems(n); }}
                    placeholder="SEO stands for Search Engine Optimization..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              ))}
              <button
                onClick={() => setFaqItems(prev => [...prev, { question: "", answer: "" }])}
                className="w-full py-2 border border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
              >
                + Add Question
              </button>
            </div>
          )}
          {type === "Organization" && (
            <>
              <Input label="Organization Name" field="name" placeholder="Acme Inc." />
              <Input label="Website URL" field="url" placeholder="https://example.com" />
              <Input label="Logo URL" field="logo" placeholder="https://example.com/logo.png" />
              <Input label="Description" field="description" placeholder="Leading tech company..." />
              <Input label="Email" field="email" placeholder="info@example.com" />
              <Input label="Phone" field="telephone" placeholder="+1-234-567-8900" />
              <Input label="Social Profiles (comma-separated)" field="sameAs" placeholder="https://twitter.com/acme, https://facebook.com/acme" />
            </>
          )}
          {type === "BreadcrumbList" && (
            <div className="space-y-3">
              {breadcrumbs.map((item, i) => (
                <div key={i} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">Name</label>
                    <input type="text" value={item.name} onChange={(e) => { const n = [...breadcrumbs]; n[i].name = e.target.value; setBreadcrumbs(n); }} placeholder="Home" className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 mb-1 block">URL</label>
                    <input type="text" value={item.url} onChange={(e) => { const n = [...breadcrumbs]; n[i].url = e.target.value; setBreadcrumbs(n); }} placeholder="https://example.com" className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  {breadcrumbs.length > 1 && (
                    <button onClick={() => setBreadcrumbs(prev => prev.filter((_, j) => j !== i))} className="text-red-400 text-xs pb-2.5 hover:text-red-300">✕</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setBreadcrumbs(prev => [...prev, { name: "", url: "" }])}
                className="w-full py-2 border border-dashed border-slate-600 rounded-xl text-sm text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
              >
                + Add Breadcrumb
              </button>
            </div>
          )}
        </div>

        {/* Output */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-slate-300">Generated JSON-LD</h3>
            <button onClick={handleCopy} className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-medium rounded-lg transition-colors">
              {copied ? "✓ Copied!" : "Copy Script Tag"}
            </button>
          </div>
          <pre className="bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] overflow-y-auto">
            {scriptTag}
          </pre>
          <p className="text-xs text-slate-500 mt-3">
            Paste this in the {"<head>"} section of your HTML page.
          </p>
        </div>
      </div>
    </main>
  );
}
