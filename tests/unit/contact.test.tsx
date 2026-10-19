import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ContactDetails } from "@/components/ContactDetails";

describe("ContactDetails", () => {
  it("renders nothing when no field is set", () => {
    expect(renderToStaticMarkup(<ContactDetails contact={{}} />)).toBe("");
  });

  it("renders a link for each set field", () => {
    const html = renderToStaticMarkup(
      <ContactDetails
        contact={{ email: "a@b.test", phone: "+1 (555) 010-0000", whatsapp: "+1 555 010 0001", address: "1 Test Road" }}
      />,
    );
    expect(html).toContain('href="mailto:a@b.test"');
    expect(html).toContain('href="tel:+15550100000"');
    expect(html).toContain('href="https://wa.me/15550100001"');
    expect(html).toContain("1 Test Road");
    expect(html).not.toContain("href=\"1 Test Road");
  });

  it("skips unset fields", () => {
    const html = renderToStaticMarkup(<ContactDetails contact={{ email: "a@b.test" }} />);
    expect(html).toContain("mailto:a@b.test");
    expect(html).not.toContain("tel:");
    expect(html).not.toContain("wa.me");
  });
});
