import { test, expect } from "@playwright/test";

test.describe("sign-up form", () => {
  test("email/password inputs have no nested double border and fill their container", async ({ page }) => {
    await page.goto("/sign-up");

    const email = page.locator("#email");
    const emailWrapper = email.locator("xpath=..");

    await expect(email).toBeVisible();

    const [emailBox, wrapperBox] = await Promise.all([
      email.boundingBox(),
      emailWrapper.boundingBox(),
    ]);
    expect(emailBox).not.toBeNull();
    expect(wrapperBox).not.toBeNull();

    // input should span nearly the full width of its pill container
    // (icon + input + small padding), not leave a visible gap.
    const usedWidth = emailBox!.width / wrapperBox!.width;
    expect(usedWidth).toBeGreaterThan(0.6);

    const style = await email.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        border: cs.borderWidth,
        outline: cs.outlineStyle,
        boxShadow: cs.boxShadow,
        background: cs.backgroundColor,
      };
    });

    // the input itself must not draw its own border/box, or it renders
    // as a "box inside a box" against the pill wrapper.
    expect(style.border).toBe("0px");
    expect(style.background).toBe("rgba(0, 0, 0, 0)");

    await email.click();
    const focusedStyle = await email.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { outline: cs.outlineStyle, boxShadow: cs.boxShadow };
    });
    expect(focusedStyle.outline).toBe("none");
    expect(focusedStyle.boxShadow).toBe("none");
  });

  test("password field toggles visibility", async ({ page }) => {
    await page.goto("/sign-up");
    const password = page.locator("#password");
    await password.fill("supersecret1");
    await expect(password).toHaveAttribute("type", "password");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
  });
});

test.describe("legal pages use the real logo", () => {
  for (const path of ["/privacy", "/terms", "/faq"]) {
    test(`${path} header renders the brand logo image`, async ({ page }) => {
      await page.goto(path);
      const logo = page.locator('header img[alt="Freestocks"]');
      await expect(logo).toBeVisible();
    });
  }
});
