import { test, expect } from '@playwright/test';

test.describe('Food Assemble - Full User E2E Journey', () => {

  test('User can login, create folder, search, rate, and bookmark a recipe', async ({ page }) => {
    
    const userEmail = 'mytedtime@gmail.com';
    const userPassword = 'Timeza.084';
    const folderName = 'My Favorite Asian Food';

    await test.step('1. Login with existing account', async () => {
      await page.goto('http://localhost:3000');
      
      await page.getByRole('link', { name: 'Login' }).click();

      await page.getByPlaceholder('you@example.com').fill(userEmail);
      await page.getByPlaceholder('Password').fill(userPassword);

      await page.locator('button[type="submit"]').click();

      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    await test.step('2. Navigate to Folders and create a new folder', async () => {
      await page.getByRole('link', { name: 'Folders' }).click();

      await expect(page.getByRole('heading', { name: 'Your Food Assemble' })).toBeVisible();

      await page.getByRole('button', { name: 'Create New Folder' }).click();

      const folderInput = page.getByPlaceholder('Folder Name', { exact: false }); 
      if (await folderInput.isVisible()) {
        await folderInput.fill(folderName);
        await page.getByRole('button', { name: /create|save/i }).click(); 
      }

      await expect(page.getByRole('heading', { name: folderName }).first()).toBeVisible();
    });

    await test.step('3. Search for a recipe and open details', async () => {
      await page.getByRole('link', { name: 'Discover' }).click();

      const searchInput = page.getByPlaceholder('Search for dishes, cuisines, ingredients...');
      await searchInput.fill('Chow Mein');
      
      const searchResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/search') && response.status() === 200
      );
      await searchInput.press('Enter');
      await searchResponsePromise;

      await expect(page.locator('text=/Search Results \\([1-9]/')).toBeVisible();

      await page.locator('h3', { hasText: 'Chow Mein' }).first().click();

      await expect(page.getByRole('heading', { name: /Chow Mein/i }).first()).toBeVisible();
    });

   await test.step('4. Rate the dish, select folder, and bookmark', async () => {
      
      const rateContainer = page.locator('text=Rate this dish:').locator('xpath=..'); 
      const fifthStar = rateContainer.locator('svg').nth(4); 
      await fifthStar.click();

      await page.getByRole('combobox').selectOption(folderName);

      const bookmarkBtn = page.getByRole('button', { name: /Bookmark/i });
      
      const buttonText = await bookmarkBtn.innerText();
      if (!buttonText.includes('Bookmarked')) {
        await bookmarkBtn.click();
      }

      const successMessage = page.locator('text=/saved|bookmarked|success/i').first();
      await expect(successMessage).toBeVisible({ timeout: 5000 }); 
    });

   await test.step('5. Verify recipe in Bookmarks and Folders', async () => {
      
      const modal = page.locator('div[role="dialog"], .fixed.inset-0').last();
      
      await modal.locator('button').first().click();

      await expect(modal).toBeHidden({ timeout: 5000 });

      await page.getByRole('link', { name: 'Bookmarks' }).click();
      await expect(page.locator('h3', { hasText: 'Chow Mein' }).first()).toBeVisible({ timeout: 7000 });

      await page.getByRole('link', { name: 'Folders' }).click();
      await expect(page.getByRole('heading', { name: 'Your Food Assemble' })).toBeVisible();

      await page.locator('h3', { hasText: folderName }).first().click();
      
      await expect(page.locator('h3', { hasText: 'Chow Mein' }).first()).toBeVisible();
    });

  });
});