import {
  detectBrand,
  extractCardNumber,
  extractExpiry,
  formatCardNumber,
  luhnCheck,
  maskCardNumber,
  parseCardText,
} from "./lib";

// Canonical processor test PANs — all Luhn-valid by design.
const VISA = "4242424242424242";
const MASTERCARD = "5555555555554444";
const MASTERCARD_2SERIES = "2223003122003222";
const AMEX = "378282246310005";
const DISCOVER = "6011111111111117";
const DINERS = "3056930009020004";
const JCB = "3566002020360505";
const UNIONPAY = "6200000000000005";

describe("luhnCheck", () => {
  it("accepts valid card numbers", () => {
    expect(luhnCheck(VISA)).toBe(true);
    expect(luhnCheck(AMEX)).toBe(true);
    expect(luhnCheck(MASTERCARD_2SERIES)).toBe(true);
  });

  it("rejects numbers that fail the checksum", () => {
    expect(luhnCheck("4242424242424241")).toBe(false);
    expect(luhnCheck("1234567812345678")).toBe(false);
  });

  it("rejects empty or non-numeric input", () => {
    expect(luhnCheck("")).toBe(false);
    expect(luhnCheck("4242 4242")).toBe(false);
    expect(luhnCheck("abcd")).toBe(false);
  });
});

describe("detectBrand", () => {
  it.each([
    [VISA, "visa"],
    [MASTERCARD, "mastercard"],
    [MASTERCARD_2SERIES, "mastercard"],
    [AMEX, "amex"],
    [DISCOVER, "discover"],
    [DINERS, "diners"],
    [JCB, "jcb"],
    [UNIONPAY, "unionpay"],
  ])("identifies %s as %s", (number, brand) => {
    expect(detectBrand(number)).toBe(brand);
  });

  it("returns unknown for unrecognised prefixes", () => {
    expect(detectBrand("1234567890123456")).toBe("unknown");
  });
});

describe("extractCardNumber", () => {
  it("pulls the PAN out of multi-line OCR text", () => {
    const text = "WORLD BANK\n4242 4242 4242 4242\n12 / 25\n";
    expect(extractCardNumber(text)).toBe(VISA);
  });

  it("handles a number split onto a single collapsed line", () => {
    expect(extractCardNumber("0000 4242424242424242 0000")).toBe(VISA);
  });

  it("ignores digit runs that fail Luhn", () => {
    // 16 digits, recognised-looking prefix, but not Luhn-valid.
    expect(extractCardNumber("4242 4242 4242 4243")).toBeNull();
  });

  it("returns null when there is no card-length digit run", () => {
    expect(extractCardNumber("HELLO 12 / 25 WORLD")).toBeNull();
  });

  it("prefers a known brand when several lines pass Luhn", () => {
    // The Amex line (15) and Visa line (16) both pass Luhn; both are known
    // brands — the longer one wins the tie-break.
    const text = `${AMEX}\n${VISA}`;
    expect(extractCardNumber(text)).toBe(VISA);
  });
});

describe("extractExpiry", () => {
  it("reads MM/YY", () => {
    expect(extractExpiry("12/25")).toBe("12/25");
  });

  it("normalises MM/YYYY to MM/YY", () => {
    expect(extractExpiry("VALID THRU 08/2027")).toBe("08/27");
  });

  it("tolerates spaces around the separator", () => {
    expect(extractExpiry("09 / 26")).toBe("09/26");
  });

  it("rejects invalid months", () => {
    expect(extractExpiry("13/25")).toBeNull();
    expect(extractExpiry("99/99")).toBeNull();
  });

  it("returns null when no date is present", () => {
    expect(extractExpiry("4242 4242 4242 4242")).toBeNull();
  });
});

describe("formatCardNumber", () => {
  it("groups 16-digit numbers into fours", () => {
    expect(formatCardNumber(VISA)).toBe("4242 4242 4242 4242");
  });

  it("uses 4-6-5 grouping for Amex", () => {
    expect(formatCardNumber(AMEX)).toBe("3782 822463 10005");
  });
});

describe("maskCardNumber", () => {
  it("keeps the first and last four digits", () => {
    expect(maskCardNumber(VISA)).toBe("4242 •••••••• 4242");
  });

  it("leaves short strings untouched", () => {
    expect(maskCardNumber("1234")).toBe("1234");
  });
});

describe("parseCardText", () => {
  it("returns a structured result for a full card read", () => {
    const text = "4242 4242 4242 4242\n12/25";
    expect(parseCardText(text)).toEqual({
      number: VISA,
      brand: "visa",
      expiry: "12/25",
    });
  });

  it("reports a null number when nothing valid is found", () => {
    expect(parseCardText("just some words")).toEqual({
      number: null,
      brand: "unknown",
      expiry: null,
    });
  });
});
