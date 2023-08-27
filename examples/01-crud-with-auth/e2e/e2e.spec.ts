import { Dialog, expect, Page, test } from "@playwright/test";

async function login(
  page: Page,
  credentials: { username: string; password: string }
) {
  await page.goto("http://localhost/");
  await page.getByPlaceholder("Username").click();
  await page.getByPlaceholder("Username").fill(credentials.username);
  await page.getByPlaceholder("Username").press("Tab");
  await page.getByPlaceholder("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Login" }).click();
}

async function createProduct(page: Page, name: string, price: number) {
  await new Promise<void>((resolve) => {
    const nameDialogHandler = (dialog: Dialog) => {
      const priceDialogHandler = (dialog: Dialog) => {
        page.removeListener("dialog", priceDialogHandler);
        dialog.accept(`${price}`);
        resolve();
      };

      page.on("dialog", priceDialogHandler);

      dialog.accept(name);
      page.removeListener("dialog", nameDialogHandler);
    };

    page.on("dialog", nameDialogHandler);
    page.getByRole("button", { name: "New product" }).click();
  });
}

async function deleteProduct(page: Page, name: string) {
  page.once("dialog", (dialog) => {
    dialog.accept();
  });
  await page
    .locator(".card")
    .filter({ hasText: name })
    .getByRole("button", { name: "Delete" })
    .click();
}

function getProductCard(page: Page, name: string) {
  return page.locator(".card").filter({ hasText: name });
}

test("Create and delete a product as admin", async ({ page, browser }) => {
  // Navigate to the page and log in as admin
  await login(page, { username: "admin", password: "ihavethepower" });

  // Create a new product and expect it to become visible
  const newProductName = `Test product ${browser
    .browserType()
    .name()} - ${Date.now()}`;
  await createProduct(page, newProductName, 123);

  const card = getProductCard(page, newProductName);
  await expect(card).toBeVisible();

  // Delete the product and expect it to disappear
  await deleteProduct(page, newProductName);

  await expect(page.locator(`text="${newProductName}"`)).toBeHidden();
});

test("Try to create or delete products as a non-admin", async ({
  page,
  browser,
}) => {
  // Navigate to the page and log in as a non-admin
  await login(page, { username: "normie", password: "password" });

  // Create a new product and expect it to become visible
  const newProductName = `Test product ${browser
    .browserType()
    .name()} - ${Date.now()}`;

  await createProduct(page, newProductName, 123);

  await new Promise<void>((resolve) => {
    page.on("dialog", (dialog) => {
      expect(dialog.message()).toContain("User not admin");
      resolve();
    });
  });
});
