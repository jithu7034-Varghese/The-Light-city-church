import { describe, expect, it } from "vitest";
import { detailsTable, renderSubject, renderTemplate } from "@/lib/email/render";

describe("renderTemplate", () => {
  it("escapes {{vars}} so submitters can't inject HTML", () => {
    expect(renderTemplate("<p>Hi {{name}}</p>", { name: '<img src=x onerror="alert(1)">' })).toBe(
      "<p>Hi &lt;img src=x onerror=&quot;alert(1)&quot;&gt;</p>",
    );
  });

  it("inserts {{{raw}}} only from the raw map", () => {
    expect(renderTemplate("{{{details}}}", { details: "<b>x</b>" }, { details: "<table></table>" })).toBe("<table></table>");
    expect(renderTemplate("{{{details}}}", { details: "<b>x</b>" })).toBe("");
  });

  it("renders unknown variables as empty", () => {
    expect(renderTemplate("Hi {{ missing }}!", {})).toBe("Hi !");
  });
});

describe("renderSubject", () => {
  it("strips newlines (no header injection) and caps length", () => {
    expect(renderSubject("New {{form}} from {{name}}", { form: "Prayer", name: "A\r\nBcc: x@evil" })).toBe(
      "New Prayer from A Bcc: x@evil",
    );
    expect(renderSubject("{{x}}", { x: "y".repeat(500) })).toHaveLength(200);
  });
});

describe("detailsTable", () => {
  it("escapes labels and values", () => {
    const html = detailsTable([{ label: "Message", value: "<script>" }]);
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
