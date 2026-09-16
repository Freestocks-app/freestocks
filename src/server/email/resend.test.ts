import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL_KEY = process.env.RESEND_API_KEY;

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function (this: unknown) {
    return { emails: { send: mockSend } };
  }),
}));

describe("sendVerificationEmail", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSend.mockReset();
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = ORIGINAL_KEY;
  });

  it("does not call Resend when RESEND_API_KEY is unset", async () => {
    delete process.env.RESEND_API_KEY;
    const { sendVerificationEmail } = await import("./resend");

    await sendVerificationEmail("user@example.com", "https://freestocks.app/verify?token=abc");

    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends via Resend with the expected from/to/subject when configured", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null });
    const { sendVerificationEmail } = await import("./resend");

    await sendVerificationEmail("user@example.com", "https://freestocks.app/verify?token=abc");

    expect(mockSend).toHaveBeenCalledTimes(1);
    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.from).toContain("freestocks.app");
    expect(call.subject).toMatch(/verify/i);
    expect(call.html).toContain("https://freestocks.app/verify?token=abc");
  });

  it("does not throw when Resend returns an error", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSend.mockResolvedValue({ data: null, error: { message: "invalid domain" } });
    const { sendVerificationEmail } = await import("./resend");

    await expect(
      sendVerificationEmail("user@example.com", "https://freestocks.app/verify?token=abc")
    ).resolves.toBeUndefined();
  });

  it("does not throw when the Resend call rejects", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSend.mockRejectedValue(new Error("network error"));
    const { sendVerificationEmail } = await import("./resend");

    await expect(
      sendVerificationEmail("user@example.com", "https://freestocks.app/verify?token=abc")
    ).resolves.toBeUndefined();
  });
});
