import { chromium, expect } from "@playwright/test";
process.env.AWS_EXECUTION_ENV ??= "AWS_Lambda_nodejs22.x";
const { default: binary } = await import("@sparticuz/chromium");
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
    (await binary.executablePath()),
  args: binary.args,
  headless: true,
});
const p = await browser.newPage({ viewport: { width: 1366, height: 900 } });
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
for (const route of [
  "/products",
  "/sales",
  "/customers",
  "/suppliers",
  "/purchases",
  "/cash",
  "/reports",
  "/subscription",
  "/profile",
  "/catalog",
  "/help",
]) {
  await p.goto("http://localhost:5173" + route);
  await p.locator("h1").waitFor();
  await expect(p.getByText("No pudimos mostrar esta pantalla")).toHaveCount(0);
  console.log("Route OK:", route);
}
await p.goto("http://localhost:5173/cash");
await p.getByRole("button", { name: "Abrir caja", exact: true }).click();
await p.getByLabel("Fondo inicial").fill("500");
await p.getByLabel("Notas").fill("Fondo de prueba");
await p.getByRole("button", { name: "Confirmar", exact: true }).click();
await expect(p.getByRole("heading", { name: "$500.00" })).toBeVisible();
console.log("Cash open PASS");
await p.goto("http://localhost:5173/customers");
await p.getByRole("button", { name: "Nuevo cliente" }).click();
await p
  .getByRole("dialog")
  .getByLabel("Nombre", { exact: true })
  .fill("Cliente de prueba");
await p
  .getByLabel("Correo electrónico", { exact: true })
  .fill("prueba@example.com");
await p.getByLabel("Teléfono").fill("5512345678");
await p.getByRole("button", { name: "Guardar", exact: true }).click();
await expect(p.getByRole("cell", { name: /Cliente de prueba/ })).toBeVisible();
console.log("Customer create PASS");
await p.getByTitle("Cerrar sesión").click();
await expect(
  p.getByRole("heading", { name: "Bienvenido de nuevo" }),
).toBeVisible();
await p.getByLabel("Rol de demostración").selectOption("seller");
await p.getByRole("button", { name: "Entrar a la demostración" }).click();
await p.goto("http://localhost:5173/reports");
await p.getByRole("heading", { name: "Resumen de tu negocio" }).waitFor();
await expect(p.locator("nav").getByText("Reportes")).toHaveCount(0);
console.log("Seller guard PASS");
await p.getByTitle("Cerrar sesión").click();
await p.getByLabel("Rol de demostración").selectOption("admin");
await p.getByRole("button", { name: "Entrar a la demostración" }).click();
await p.getByRole("heading", { name: "Administración global" }).waitFor();
await p.getByRole("button", { name: "Crear registro" }).click();
await p.getByLabel("Nombre", { exact: true }).fill("Negocio de prueba");
await p.getByRole("button", { name: "Guardar registro" }).click();
await expect(p.getByRole("cell", { name: "Negocio de prueba" })).toBeVisible();
console.log("Admin create PASS");
await p.setViewportSize({ width: 390, height: 844 });
await p.getByRole("button", { name: "Abrir menú" }).click();
await expect(p.locator(".sidebar")).toHaveClass(/is-open/);
await p.getByRole("button", { name: "Cerrar menú" }).click();
await expect(p.locator(".sidebar")).not.toHaveClass(/is-open/);
console.log("Mobile menu PASS");
console.log("Page errors:", errors);
if (errors.length) process.exitCode = 1;
await browser.close();
