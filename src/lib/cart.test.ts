import { describe, it, expect, beforeEach } from "vitest";
import { useCart, totals } from "../stores/cart.store";
import { products } from "./demo";
describe("POS cart", () => {
  beforeEach(() => useCart.getState().clear());
  it("merges the same product rather than duplicating a line", () => {
    useCart.getState().add(products[0]);
    useCart.getState().add(products[0]);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(2);
  });
  it("supports decimal bulk quantities", () => {
    useCart.getState().add(products[4]);
    useCart.getState().quantity(5, 0.375);
    expect(totals(useCart.getState().items, 0).total).toBe(26.21);
  });
  it("caps quantity to stock and does not add sold-out products", () => {
    useCart.getState().add({ ...products[0], stock: 0 });
    expect(useCart.getState().items).toHaveLength(0);
    useCart.getState().add(products[4]);
    useCart.getState().quantity(5, 1000);
    expect(useCart.getState().items[0].quantity).toBe(8);
  });
  it("applies line discounts before the global discount", () => {
    useCart.getState().add({ ...products[0], price: 100 });
    useCart.getState().quantity(1, 2);
    useCart.getState().lineDiscount(1, 10);
    expect(totals(useCart.getState().items, 20)).toEqual({
      subtotal: 180,
      total: 144,
    });
  });
  it("clamps invalid discounts", () => {
    useCart.getState().setDiscount(105);
    expect(useCart.getState().discount).toBe(100);
    useCart.getState().setDiscount(-10);
    expect(useCart.getState().discount).toBe(0);
  });
  it("handles NaN quantities and resets discounts on clear", () => {
    useCart.getState().add(products[0]);
    useCart.getState().quantity(1, NaN);
    expect(useCart.getState().items[0].quantity).toBe(1);
    useCart.getState().setDiscount(20);
    useCart.getState().clear();
    expect(useCart.getState().discount).toBe(0);
    expect(totals([], 0).total).toBe(0);
  });
});
