import { mkdirSync } from "node:fs";
mkdirSync("test-results", { recursive: true });
import { chromium } from "@playwright/test";
process.env.AWS_EXECUTION_ENV ??= "AWS_Lambda_nodejs22.x";
const { default: chromiumBinary } = await import("@sparticuz/chromium");
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (await chromiumBinary.executablePath()),
  args: chromiumBinary.args,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("pageerror", (e) => console.error("PAGE ERROR:", e));
await page.goto("http://localhost:5173");
await page.waitForTimeout(1800);
await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
console.log(
  "Title",
  await page.title(),
  "heading",
  await page.locator("h1").innerText(),
);
await page.goto("http://localhost:5173/pos");
await page.getByRole("button", { name: /Leche entera/ }).click();
await page.getByRole("button", { name: "Cobrar $32.50" }).click();
await page.getByLabel("Efectivo recibido").fill("50");
await page.getByRole("button", { name: "Confirmar pago" }).click();
await page.getByRole("heading", { name: "¡Venta completada!" }).waitFor();
console.log("POS checkout PASS");
await page.goto("http://localhost:5173/products");
await page.getByRole("button", { name: "Agregar producto" }).click();
await page.getByLabel("Nombre del producto").fill("Producto prueba");
await page.getByLabel("SKU", { exact: true }).fill("TEST-001");
await page.getByLabel("Precio de venta").fill("10");
await page.getByLabel("Stock inicial").fill("20");
await page.getByRole("button", { name: "Guardar producto" }).click();
await page.getByRole("cell", { name: "Producto prueba TEST-001" }).waitFor();
console.log("Product create PASS");
await page.setViewportSize({ width: 390, height: 844 });
await page.goto("http://localhost:5173");
await page.waitForTimeout(500);
await page.screenshot({ path: "test-results/mobile.png", fullPage: true });
console.log(
  "Mobile overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
await browser.close();
