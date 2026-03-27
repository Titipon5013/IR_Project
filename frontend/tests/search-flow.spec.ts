import { test, expect } from '@playwright/test';

test('User can search for a recipe and see results', async ({ page }) => {
  await page.goto('http://localhost:3000');

  await expect(page.locator('text=Discover Food Assemble')).toBeVisible();

  const searchInput = page.getByPlaceholder('Search for dishes, cuisines, ingredients...');
  await searchInput.click();
  await searchInput.fill('chicken');

  const searchResponsePromise = page.waitForResponse(response => 
    response.url().includes('/api/search') && response.status() === 200
  );

  await searchInput.press('Enter');
  await searchResponsePromise;

  await expect(page.getByText('No recipes found')).toBeHidden({ timeout: 10000 });
  await expect(page.locator('text=/Search Results \\([1-9]/')).toBeVisible();

  await expect(page.locator('h3').first()).toBeVisible();

  await page.waitForFunction(() => {
    const images = Array.from(document.querySelectorAll('img'));
    
    const visibleImages = images.filter(img => img.clientWidth > 0 && img.clientHeight > 0);
    
    return visibleImages.length > 0 && visibleImages.every((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  }, { timeout: 15000 });
});