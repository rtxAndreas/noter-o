import { test, expect } from "@playwright/test";

test.describe("Noter-O app", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      const openDB = indexedDB.open("NoteO");
      openDB.onsuccess = () => {
        const tx = openDB.result.transaction(["notes"], "readwrite");
        tx.objectStore("notes").clear();
      };
    });
    await page.reload();
    await expect(
      page.getByText("Aucune note pour l'instant")
    ).toBeVisible({ timeout: 10000 });
  });

  test("adds and calculates a single-line note", async ({ page }) => {
    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill("20000ar (carburant) + 3000");
    await page.getByRole("button", { name: "Ajouter" }).click();

    await expect(page.getByText("20000ar (carburant) + 3000")).toBeVisible();
    await expect(page.getByText("total =")).toBeVisible();
    await expect(page.getByText("23.000").first()).toBeVisible();
  });

  test("adds a multi-line session with implicit addition and dot thousands", async ({
    page,
  }) => {
    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill(
      "gouter 2000ar (operateur) 1000 bus\nloyer 100.000 (cent mille ariary) + provision 400.000 ar"
    );
    await page.getByRole("button", { name: "Ajouter" }).click();

    await expect(
      page.getByText("gouter 2000ar (operateur) 1000 bus")
    ).toBeVisible();
    await expect(
      page.getByText("loyer 100.000 (cent mille ariary) + provision 400.000 ar")
    ).toBeVisible();
    await expect(page.getByText("503.000").first()).toBeVisible();
  });

  test("allows choosing a session date", async ({ page }) => {
    const datePicker = page.getByLabel("Date de l'événement");
    await datePicker.fill("2026-09-10");

    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill("100 + 200");
    await page.getByRole("button", { name: "Ajouter" }).click();

    await expect(page.getByText("10 sept. 2026")).toBeVisible();
  });

  test("shows invalid marker and keeps text for invalid expression", async ({
    page,
  }) => {
    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill("bonjour le monde");

    await expect(page.getByText("= invalide")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Corriger la ligne" })
    ).toBeDisabled();
    await expect(page.getByText("Aucune note pour l'instant")).toBeVisible();
    await expect(input).toHaveValue("bonjour le monde");
  });

  test("searches notes", async ({ page }) => {
    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill("1000 (pain) + 500");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("1000 (pain) + 500")).toBeVisible();

    const search = page.getByPlaceholder(/Rechercher/);
    await search.fill("cafe");
    await expect(page.getByText("Aucune note pour l'instant")).toBeVisible();

    await search.fill("pain");
    await expect(page.getByText("1000 (pain) + 500")).toBeVisible();
  });

  test("deletes a session with undo", async ({ page }) => {
    const input = page.getByPlaceholder(/20000ar \(carburant\)/);
    await input.fill("500 + 500\n200 (pain) + 100");
    await page.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("500 + 500")).toBeVisible();

    await page.getByLabel("Supprimer la session").last().click();
    await page.getByRole("button", { name: "Confirmer" }).click();

    await expect(page.getByText("Session supprimée")).toBeVisible();
    await expect(page.getByText("Annuler")).toBeVisible();
  });

  test("uses keyboard shortcut Ctrl+K to focus search", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await expect(page.getByPlaceholder(/Rechercher/)).toBeFocused();
  });

  test("catches empty state gracefully", async ({ page }) => {
    await expect(
      page.getByText("Saisissez une opération ci-dessus")
    ).toBeVisible();
  });

  test("renders PWA meta tags", async ({ page }) => {
    await page.goto("/");
    const manifest = await page.evaluate(() =>
      document.querySelector('link[rel="manifest"]')?.getAttribute("href")
    );
    expect(manifest).toBe("/manifest.json");

    const viewport = await page.evaluate(() =>
      document
        .querySelector('meta[name="viewport"]')
        ?.getAttribute("content")
    );
    expect(viewport).toContain("width=device-width");
  });

  test("offline page exists", async ({ page }) => {
    await page.goto("/offline");
    await expect(page.getByText("Hors ligne")).toBeVisible();
  });

  test("registers service worker", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    const swUrl = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs[0]?.active?.scriptURL ?? null;
    });
    expect(swUrl).toContain("/serwist/sw.js");
  });

  test("works fully offline after first visit", async ({ page, context }) => {
    await page.goto("/");
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForTimeout(1500);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Noter-O" })).toBeVisible();
    await expect(page.getByText("Total général")).toBeVisible();
  });
});
