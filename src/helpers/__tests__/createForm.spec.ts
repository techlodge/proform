import { describe, it, expect } from "vitest";

describe("createForm", () => {
  it("should return a tuple with Form and actions", async () => {
    const { createForm } = await import("@/helpers/createForm");
    const [Form, actions] = createForm({
      schemas: [],
    });
    expect(Form).toBeDefined();
    expect(typeof actions.submit).toBe("function");
  });
});
