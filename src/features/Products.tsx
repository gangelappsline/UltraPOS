import { ImportProducts, ProductVariants } from "./CatalogTools";
import { ProductImage } from "../components/shared/ProductImage";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Package,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useDemo } from "../stores/demo.store";
import { useAuth } from "../stores/auth.store";
import { useResource } from "../api/hooks";
import { request } from "../api/client";
import { money } from "../lib/utils";
import type { Product } from "../types";
import { Button } from "../components/ui/button";
import {
  Can,
  PageTitle,
  Modal,
  DataTable,
  downloadCSV,
  QueryState,
} from "../components/shared/common";
const schema = z.object({
  name: z.string().min(2, "Nombre requerido"),
  sku: z.string().min(1, "SKU requerido"),
  barcode: z.string(),
  category: z.string().min(1),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  unit: z.string(),
});
export function Products() {
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const [category, setCategory] = useState("Todas las categorías");
  const [low, setLow] = useState(params.get("stock") === "low");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Product | null | undefined>(
    params.has("new") ? null : undefined,
  );
  const [adjust, setAdjust] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const store = useDemo();
  const demo = useAuth((s) => s.demo);
  const qc = useQueryClient();
  const { data, isLoading, error } = useResource("/products", store.products, {
    page,
    per_page: 8,
    search,
    category: category === "Todas las categorías" ? undefined : category,
    low_stock: low || undefined,
  });
  let items = data?.data || [];
  if (demo)
    items = items.filter(
      (p) =>
        (p.name + " " + p.sku + " " + p.barcode)
          .toLowerCase()
          .includes(search.toLowerCase()) &&
        (category === "Todas las categorías" || p.category === category) &&
        (!low || p.stock < 10),
    );
  const total = demo ? items.length : data?.pagination?.total || 0;
  const pages = demo
    ? Math.max(1, Math.ceil(total / 8))
    : data?.pagination?.last_page || 1;
  const mutation = useMutation({
    mutationFn: async (p: Product) =>
      demo
        ? store.saveProduct(p)
        : request(
            p.id && edit ? "PUT" : "POST",
            edit ? `/products/${p.id}` : "/products",
            p,
          ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/products"] });
      toast.success(edit ? "Producto actualizado" : "Producto creado");
      setEdit(undefined);
    },
  });
  async function remove(p: Product) {
    if (!confirm(`¿Eliminar ${p.name}?`)) return;
    if (demo) store.deleteProduct(p.id);
    else await request("DELETE", `/products/${p.id}`);
    qc.invalidateQueries({ queryKey: ["/products"] });
    toast.success("Producto eliminado");
  }
  return (
    <>
      <PageTitle
        title="Productos"
        description="Un catálogo organizado. Un negocio que fluye."
      >
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(
              "productos",
              items.map((p) => ({ ...p })),
            )
          }
        >
          <Download size={16} />
          Exportar CSV
        </Button>
        <Can>
          <Button asChild variant="outline">
            <Link to="/catalog">Catálogo</Link>
          </Button>
          <ImportProducts />
          <Button onClick={() => setEdit(null)}>
            <Plus size={17} />
            Agregar producto
          </Button>
        </Can>
      </PageTitle>
      <div className="mini-stats">
        <div>
          <Package />
          <span>
            Productos en catálogo<strong>{total}</strong>
          </span>
        </div>
        <div>
          <span className="status-dot" />
          <span>
            Valor del inventario
            <strong>
              {money(items.reduce((s, p) => s + p.price * p.stock, 0))}
            </strong>
          </span>
        </div>
        <div>
          <span className="status-dot amber-dot" />
          <span>
            Stock bajo
            <strong>
              {items.filter((p) => p.stock < 10).length} productos
            </strong>
          </span>
        </div>
      </div>
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={18} />
            <input
              placeholder="Buscar por nombre, SKU o código de barras..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            {[
              "Todas las categorías",
              "Lácteos",
              "Panadería",
              "Bebidas",
              "Frutas y verduras",
              "Abarrotes",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <button
            className={`btn ${low ? "btn-primary" : "btn-outline"}`}
            onClick={() => {
              setLow(!low);
              setPage(1);
            }}
          >
            <SlidersHorizontal size={15} />
            Stock bajo
          </button>
        </div>
        <QueryState loading={isLoading} error={error} />
        <DataTable<Product>
          data={demo ? items.slice((page - 1) * 8, page * 8) : items}
          page={page}
          pages={pages}
          total={total}
          onPage={setPage}
          columns={[
            {
              header: "Producto",
              accessorKey: "name",
              cell: (c) => (
                <div className="product-cell">
                  <span
                    className="product-visual"
                    style={{ background: c.row.original.color }}
                  >
                    <ProductImage product={c.row.original} />
                  </span>
                  <div>
                    <strong>{c.getValue()}</strong>
                    <small>{c.row.original.sku}</small>
                  </div>
                </div>
              ),
            },
            { header: "Categoría", accessorKey: "category" },
            {
              header: "Precio de venta",
              accessorKey: "price",
              cell: (c) => <strong>{money(c.getValue())}</strong>,
            },
            {
              header: "Stock",
              accessorKey: "stock",
              cell: (c) => (
                <span
                  className={
                    c.getValue() < 10 ? "stock-badge" : "text-green-800"
                  }
                >
                  {c.getValue()} {c.row.original.unit}
                </span>
              ),
            },
            {
              header: "Estado",
              id: "status",
              cell: (c) => (
                <span
                  className={`badge ${c.row.original.stock ? "badge-green" : "badge-neutral"}`}
                >
                  {c.row.original.stock ? "Activo" : "Agotado"}
                </span>
              ),
            },
            {
              header: "Acciones",
              id: "actions",
              cell: (c) => (
                <Can>
                  <div className="flex gap-1">
                    <ProductVariants product={c.row.original} />
                    <button
                      title="Editar producto"
                      className="icon-btn"
                      onClick={() => setEdit(c.row.original)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title="Ajustar stock"
                      className="icon-btn"
                      onClick={() => {
                        setAdjust(c.row.original);
                        setQuantity("");
                      }}
                    >
                      <SlidersHorizontal size={15} />
                    </button>
                    <button
                      title="Eliminar producto"
                      className="icon-btn text-red-500"
                      onClick={() => void remove(c.row.original)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </Can>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={edit !== undefined}
        onClose={() => setEdit(undefined)}
        title={edit ? "Editar producto" : "Agregar producto"}
      >
        {edit !== undefined && (
          <ProductForm
            key={edit?.id || "new"}
            product={edit}
            busy={mutation.isPending}
            onSave={(values) =>
              mutation.mutate({
                ...values,
                id: edit?.id || Date.now(),
                color: edit?.color || "#edf1e8",
                emoji: edit?.emoji || "📦",
              })
            }
          />
        )}
      </Modal>
      <Modal
        open={!!adjust}
        onClose={() => setAdjust(null)}
        title="Ajustar inventario"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!adjust) return;
            const delta = Number(quantity);
            if (adjust.stock + delta < 0) {
              toast.error("El stock no puede ser negativo");
              return;
            }
            if (demo)
              store.saveProduct({ ...adjust, stock: adjust.stock + delta });
            else
              await request("POST", `/products/${adjust.id}/adjust-stock`, {
                quantity: delta,
                reason,
              });
            qc.invalidateQueries({ queryKey: ["/products"] });
            setAdjust(null);
            toast.success("Inventario actualizado");
          }}
        >
          <p className="muted mb-5">
            {adjust?.name} · Stock actual: {adjust?.stock}
          </p>
          <label>
            Ajuste de cantidad (+ ingreso / − salida)
            <input
              required
              type="number"
              step="0.001"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label>
            Motivo del ajuste
            <input
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Conteo físico, merma…"
            />
          </label>
          <Button className="w-full mt-5">Guardar ajuste</Button>
        </form>
      </Modal>
    </>
  );
}
function ProductForm({
  product,
  onSave,
  busy,
}: {
  product: Product | null;
  onSave: (p: z.infer<typeof schema>) => void;
  busy: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: product || {
      name: "",
      sku: "",
      barcode: "",
      category: "Abarrotes",
      price: 0,
      cost: 0,
      stock: 0,
      unit: "pz",
    },
  });
  return (
    <form onSubmit={handleSubmit(onSave)}>
      <label>
        Nombre del producto
        <input {...register("name")} />
      </label>
      <div className="form-grid">
        <label>
          SKU
          <input {...register("sku")} />
        </label>
        <label>
          Código de barras
          <input {...register("barcode")} />
        </label>
        <label>
          Categoría
          <select {...register("category")}>
            {[
              "Abarrotes",
              "Lácteos",
              "Panadería",
              "Bebidas",
              "Frutas y verduras",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Unidad
          <select {...register("unit")}>
            <option>pz</option>
            <option>kg</option>
            <option>lt</option>
          </select>
        </label>
        <label>
          Precio de venta
          <input type="number" step="0.01" {...register("price")} />
        </label>
        <label>
          Costo
          <input type="number" step="0.01" {...register("cost")} />
        </label>
        <label>
          Stock inicial
          <input
            disabled={!!product}
            type="number"
            step="0.001"
            {...register("stock")}
          />
        </label>
      </div>
      {Object.values(errors).map((e, i) => (
        <p className="field-error" key={i}>
          {e.message}
        </p>
      ))}
      <Button disabled={busy} className="w-full mt-5">
        {busy ? "Guardando…" : "Guardar producto"}
      </Button>
    </form>
  );
}
