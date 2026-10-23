/**
 * Structured data for search engines and AI answer engines. Server-rendered
 * into the page HTML; `<` is escaped so text can never close the script tag.
 */
export default function JsonLd({ data }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
