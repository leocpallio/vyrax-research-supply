import { describe, expect, test } from "bun:test";
import {
  classifyStatus,
  formatPostcode,
  isUkPostcode,
  orderRef,
  validateFields,
} from "./checkout-form";

const ok = {
  name: "A B",
  email: "a@b.co",
  phone: "",
  address: "1 High St",
  address2: "",
  city: "Leeds",
  postcode: "ls1 4ap",
};
describe("checkout-form", () => {
  test("postcodes", () => {
    expect(isUkPostcode("SW1A 1AA")).toBe(true);
    expect(isUkPostcode("m11aa")).toBe(true);
    expect(isUkPostcode("12345")).toBe(false);
    expect(formatPostcode("ls14ap")).toBe("LS1 4AP");
  });
  test("validate", () => {
    expect(validateFields(ok, true)).toEqual({});
    const e = validateFields({ ...ok, email: "x", postcode: "zz" }, false);
    expect(Object.keys(e).sort()).toEqual(["agree", "email", "postcode"]);
  });
  test("status", () => {
    expect(classifyStatus("paid")).toBe("paid");
    expect(classifyStatus("pending")).toBe("processing");
    expect(classifyStatus("expired")).toBe("expired");
    expect(classifyStatus("failed")).toBe("failed");
    expect(orderRef("abcdef12-0000-0000-0000-000000000000")).toBe("VX-ABCDEF12");
  });
});
