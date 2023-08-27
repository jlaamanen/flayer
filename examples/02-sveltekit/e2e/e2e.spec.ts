import { Dialog, expect, test } from '@playwright/test';

test('Greet', async ({ page }) => {
  await page.goto('http://localhost/');

  const name = 'John Doe';

  await page.getByPlaceholder('Name').fill(name);

  const dialogMessage = await new Promise<string>((resolve) => {
    const nameDialogHandler = (dialog: Dialog) => {
      page.removeListener('dialog', nameDialogHandler);
      resolve(dialog.message());
    };

    page.on('dialog', nameDialogHandler);
    page.getByRole('button', { name: 'Greet me!' }).click();
  });

  expect(dialogMessage).toBe(`Hello, ${name}!`);
});
