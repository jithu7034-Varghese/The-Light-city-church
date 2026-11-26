import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "@/lib/csv";

describe("csvCell", () => {
  it("leaves simple values alone", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
    expect(csvCell(true)).toBe("true");
  });

  it("renders null/undefined as empty", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes and newlines (RFC 4180)", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line 1\nline 2")).toBe('"line 1\nline 2"');
    expect(csvCell("cr\r\nlf")).toBe('"cr\r\nlf"');
  });

  it("keeps leading/trailing spaces by quoting", () => {
    expect(csvCell(" padded ")).toBe('" padded "');
  });

  it.each(["=SUM(A1:A9)", "+1+1", "-2+3", "@cmd", "\tTAB", "=HYPERLINK(\"http://evil\")"])(
    "neutralises formula injection in %j",
    (v) => {
      const out = csvCell(v);
      expect(out.replace(/^"/, "").startsWith("'")).toBe(true);
    },
  );

  it("serialises dates and objects", () => {
    expect(csvCell(new Date("2026-11-24T10:00:00Z"))).toBe("2026-11-24T10:00:00.000Z");
    expect(csvCell({ a: 1 })).toBe('"{""a"":1}"');
  });
});

describe("toCsv", () => {
  const rows = [
    { name: "Pat O'Neil", email: "pat@x.org", message: "Hello, world" },
    { name: "=evil()", email: null, message: 'Line one\n"quoted"' },
  ];
  const csv = toCsv(rows, [
    { header: "Name", value: (r) => r.name },
    { header: "Email", value: (r) => r.email },
    { header: "Message", value: (r) => r.message },
  ]);

  it("starts with a BOM and a header row", () => {
    expect(csv.startsWith("﻿Name,Email,Message\r\n")).toBe(true);
  });

  it("produces one CRLF-terminated record per row", () => {
    expect(csv).toBe(
      "﻿Name,Email,Message\r\n" +
        "Pat O'Neil,pat@x.org,\"Hello, world\"\r\n" +
        "'=evil(),,\"Line one\n\"\"quoted\"\"\"\r\n",
    );
  });

  it("outputs only the header for no rows", () => {
    expect(toCsv([], [{ header: "A", value: () => 1 }])).toBe("﻿A\r\n");
  });
});
