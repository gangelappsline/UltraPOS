import { ProductImage } from "../components/shared/ProductImage";
import { useState } from "react";
import {
  Search,
  ScanBarcode,
  Plus,
  Minus,
  Trash2,
  ShoppingBasket,
  ArrowRight,
  Check,
  Printer,
  Mail,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCart, totals } from "../stores/cart.store";
import { useAuth } from "../stores/auth.store";
import { useDemo } from "../stores/demo.store";
import { useResource } from "../api/hooks";
import { request } from "../api/client";
import { money } from "../lib/utils";
import type { Product, Sale } from "../types";
import { Button } from "../components/ui/button";
import { PageTitle, Modal, QueryState } from "../components/shared/common";
export function POS() {
  const cart = useCart();
  const store = useDemo();
  const demo = useAuth((s) => s.demo);
  const businessName = useAuth(
    (s) =>
      s.user?.businesses.find((b) => b.id === s.businessId)?.name ||
      "Mi negocio",
  );
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [customer, setCustomer] = useState("Público general");
  const [payment, setPayment] = useState("Efectivo");
  const [received, setReceived] = useState("");
  const [checkout, setCheckout] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [email, setEmail] = useState("");
  const { data, isLoading, error } = useResource("/products", store.products, {
    search,
    per_page: 100,
  });
  const { data: customers } = useResource("/customers", store.customers);
  const products = (data?.data || []).filter(
    (p) =>
      (p.name + " " + p.sku + " " + p.barcode)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (category === "Todos" || p.category === category),
  );
  const { subtotal, total } = totals(cart.items, cart.discount);
  const sale = useMutation({
    mutationFn: async () => {
      if (payment === "Efectivo" && +received < total)
        throw new Error("El efectivo recibido es insuficiente");
      if (demo) {
        for (const i of cart.items) {
          if (
            (store.products.find((p) => p.id === i.product.id)?.stock || 0) <
            i.quantity
          )
            throw new Error("Stock insuficiente para " + i.product.name);
        }
        const s: Sale = {
          id: Date.now(),
          number: `V-${Math.max(...store.sales.map((s) => Number(s.number.replace("V-", ""))), 1048) + 1}`,
          customer,
          total,
          items: [...cart.items],
          created_at: new Date().toISOString(),
          payment_method: payment,
          status: "Completada",
        };
        store.addSale(s);
        return s;
      }
      return (
        await request<Sale>("POST", "/sales", {
          items: cart.items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
            discount: i.discount,
          })),
          discount: cart.discount,
          customer_id: customers?.data.find((c) => c.name === customer)?.id,
          payment_method: (
            {
              Efectivo: "cash",
              Tarjeta: "card",
              Transferencia: "transfer",
              Crédito: "credit",
            } as Record<string, string>
          )[payment],
          amount_received: +received,
        })
      ).data;
    },
    onSuccess: async (s) => {
      setReceipt(s);
      setCheckout(false);
      cart.clear();
      setReceived("");
      qc.invalidateQueries();
      toast.success("Venta completada");
    },
    onError: (e) => {
      if (demo) toast.error(e.message);
    },
  });
  async function scan() {
    const p = demo
      ? store.products.find((p) => p.barcode === search)
      : (
          await request<Product>(
            "GET",
            `/products/barcode/${encodeURIComponent(search)}`,
          )
        ).data;
    if (p) {
      cart.add(p);
      setSearch("");
      toast.success("Producto agregado");
    } else toast.error("Código de barras no encontrado");
  }
  return (
    <>
      <PageTitle
        title="Punto de venta"
        description="Cada venta, una nueva oportunidad."
      >
        <span className="badge badge-green">
          <i />
          Terminal 01
        </span>
      </PageTitle>
      <div className="pos-grid">
        <section>
          <form
            className="search-field pos-search"
            onSubmit={(e) => {
              e.preventDefault();
              void scan();
            }}
          >
            <Search size={20} />
            <input
              autoFocus
              placeholder="Busca un producto o escanea su código…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button aria-label="Buscar código de barras">
              <ScanBarcode size={22} />
            </button>
          </form>
          <div className="category-tabs">
            {[
              "Todos",
              "Abarrotes",
              "Bebidas",
              "Lácteos",
              "Panadería",
              "Frutas y verduras",
            ].map((c) => (
              <button
                className={category === c ? "selected" : ""}
                onClick={() => setCategory(c)}
                key={c}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex justify-between mb-4 text-sm">
            <strong>Tu catálogo</strong>
            <span className="muted">{products.length} productos</span>
          </div>
          <QueryState loading={isLoading} error={error} />
          <div className="product-grid">
            {products.map((p) => (
              <button
                key={p.id}
                className="product-card"
                disabled={!p.stock}
                onClick={() => cart.add(p)}
              >
                <div
                  className="product-picture"
                  style={{ background: p.color || "#edf1e8" }}
                >
                  <span>
                    <ProductImage product={p} />
                  </span>
                  <small>
                    {p.stock} {p.unit}
                  </small>
                </div>
                <div className="product-card-body">
                  <small>{p.category}</small>
                  <h3>{p.name}</h3>
                  <div>
                    <strong>{money(p.price)}</strong>
                    <span className="product-add">
                      <Plus size={17} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {!products.length && !isLoading && (
            <div className="empty">
              No encontramos productos con esa búsqueda.
            </div>
          )}
        </section>
        <section className="panel cart-panel">
          <div className="panel-heading">
            <h3>
              <ShoppingBasket size={19} />
              Venta actual{" "}
              <span className="count-pill">{cart.items.length}</span>
            </h3>
            <button
              className="icon-btn"
              title="Vaciar carrito"
              onClick={() => cart.clear()}
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="cart-customer">
            <label>
              Cliente
              <select
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
              >
                <option>Público general</option>
                {customers?.data.map((c) => (
                  <option key={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="cart-items">
            {!cart.items.length ? (
              <div className="empty">
                <span className="empty-icon">
                  <ShoppingBasket size={30} />
                </span>
                <strong>Tu próxima venta comienza aquí</strong>
                <p>
                  Agrega productos del catálogo
                  <br />o escanea un código de barras.
                </p>
              </div>
            ) : (
              cart.items.map((i) => (
                <div className="cart-item" key={i.product.id}>
                  <div className="flex items-center gap-3">
                    <span
                      className="product-visual"
                      style={{ background: i.product.color }}
                    >
                      <ProductImage product={i.product} />
                    </span>
                    <div className="flex-1">
                      <strong>{i.product.name}</strong>
                      <small>
                        {money(i.product.price)} / {i.product.unit}
                      </small>
                    </div>
                    <button
                      title="Quitar producto"
                      className="icon-btn"
                      onClick={() => cart.remove(i.product.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity">
                      <button
                        onClick={() =>
                          i.quantity <= 1
                            ? cart.remove(i.product.id)
                            : cart.quantity(i.product.id, i.quantity - 1)
                        }
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        aria-label="Cantidad"
                        type="number"
                        step="0.001"
                        value={i.quantity}
                        onChange={(e) =>
                          cart.quantity(i.product.id, +e.target.value)
                        }
                      />
                      <button
                        onClick={() =>
                          cart.quantity(i.product.id, i.quantity + 1)
                        }
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <label className="line-discount">
                      <input
                        aria-label="Descuento por línea"
                        type="number"
                        min="0"
                        max="100"
                        value={i.discount}
                        onChange={(e) =>
                          cart.lineDiscount(i.product.id, +e.target.value)
                        }
                      />
                      % dto.
                    </label>
                    <strong>
                      {money(
                        i.product.price * i.quantity * (1 - i.discount / 100),
                      )}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="cart-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            <div>
              <label>Descuento global</label>
              <span>
                <input
                  aria-label="Descuento global"
                  type="number"
                  min="0"
                  max="100"
                  value={cart.discount}
                  onChange={(e) => cart.setDiscount(+e.target.value)}
                />{" "}
                %
              </span>
            </div>
            <div className="grand-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>
            <small className="muted">
              Precios finales · Impuestos incluidos según catálogo
            </small>
            <Button
              className="w-full mt-5"
              disabled={!cart.items.length}
              onClick={() => setCheckout(true)}
            >
              Cobrar {money(total)}
              <ArrowRight size={18} />
            </Button>
          </div>
        </section>
      </div>
      <Modal
        open={checkout}
        onClose={() => setCheckout(false)}
        title="Finalizar venta"
      >
        <div className="checkout-total">
          <small>Total a cobrar</small>
          <strong>{money(total)}</strong>
        </div>
        <label>
          Método de pago
          <select value={payment} onChange={(e) => setPayment(e.target.value)}>
            {["Efectivo", "Tarjeta", "Transferencia", "Crédito"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {payment === "Efectivo" && (
          <>
            <label>
              Efectivo recibido
              <input
                type="number"
                min={total}
                step="0.01"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
              />
            </label>
            <p className="change-line">
              Cambio <strong>{money(Math.max(0, +received - total))}</strong>
            </p>
          </>
        )}
        {payment === "Crédito" && customer === "Público general" && (
          <p className="field-error">
            Selecciona un cliente para vender a crédito.
          </p>
        )}
        <Button
          className="w-full mt-5"
          disabled={
            sale.isPending ||
            (payment === "Efectivo" && +received < total) ||
            (payment === "Crédito" && customer === "Público general")
          }
          onClick={() => sale.mutate()}
        >
          <Check size={18} />
          {sale.isPending ? "Procesando…" : "Confirmar pago"}
        </Button>
      </Modal>
      <Modal
        open={!!receipt}
        onClose={() => setReceipt(null)}
        title="¡Venta completada!"
      >
        {receipt && (
          <div className="receipt">
            <div className="receipt-heading">
              ultrapos<small>{businessName}</small>
            </div>
            <p>
              Recibo #{receipt.number}
              <br />
              {new Date(receipt.created_at).toLocaleString("es-MX")}
            </p>
            {receipt.items.map((i) => (
              <div className="receipt-line" key={i.product.id}>
                <span>
                  {i.quantity} × {i.product.name}
                </span>
                <strong>
                  {money(i.quantity * i.product.price * (1 - i.discount / 100))}
                </strong>
              </div>
            ))}
            <div className="receipt-line grand-total">
              <span>Total</span>
              <strong>{money(receipt.total)}</strong>
            </div>
            <p>
              {receipt.payment_method} · {receipt.customer}
            </p>
            <p className="text-center">¡Gracias por tu compra!</p>
            <Button
              className="w-full"
              variant="outline"
              onClick={async () => {
                if (!demo) {
                  const r = await request<{ url: string }>(
                    "GET",
                    `/sales/${receipt.id}/receipt`,
                  );
                  window.open(r.data.url, "_blank", "noopener");
                } else window.print();
              }}
            >
              <Printer size={16} />
              Imprimir recibo
            </Button>
            <form
              className="flex gap-2 mt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (demo)
                  toast.info("Demostración: no se envían correos reales");
                else {
                  await request("POST", `/sales/${receipt.id}/receipt/email`, {
                    email,
                  });
                  toast.success("Recibo enviado");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="Correo del cliente"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button aria-label="Enviar recibo">
                <Mail size={17} />
              </Button>
            </form>
          </div>
        )}
      </Modal>
    </>
  );
}
