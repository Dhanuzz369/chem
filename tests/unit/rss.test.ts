import { describe, expect, it } from "vitest";
import { blogFeed } from "@/lib/seo/rss";
import { absoluteUrl } from "@/config/site";

const post = (slug: string, date: string, title = slug) => ({ slug, title, description: `About ${title}`, date, products: [] });

describe("blogFeed", () => {
  it("lists posts newest first with RFC 822 dates and permalinks", () => {
    const xml = blogFeed([post("older", "2026-10-02"), post("newer", "2026-10-15")]);
    expect(xml.indexOf("/blog/newer")).toBeLessThan(xml.indexOf("/blog/older"));
    expect(xml).toContain(`<guid isPermaLink="true">${absoluteUrl("/blog/newer")}</guid>`);
    expect(xml).toContain("<pubDate>Thu, 15 Oct 2026 00:00:00 GMT</pubDate>");
    expect(xml).toContain("<lastBuildDate>Thu, 15 Oct 2026 00:00:00 GMT</lastBuildDate>");
    expect(xml).toContain(`href="${absoluteUrl("/blog/feed.xml")}" rel="self"`);
  });

  it("escapes markup in titles and descriptions", () => {
    const xml = blogFeed([post("x", "2026-10-01", `SLES <70%> & "28%"`)]);
    expect(xml).toContain("<title>SLES &lt;70%&gt; &amp; &quot;28%&quot;</title>");
    expect(xml).not.toContain("<70%>");
  });

  it("is still a valid empty channel with no posts", () => {
    const xml = blogFeed([]);
    expect(xml).toContain("<channel>");
    expect(xml).not.toContain("<item>");
    expect(xml).not.toContain("lastBuildDate");
  });
});
