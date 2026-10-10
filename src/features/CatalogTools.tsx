import { useState } from "react";
import Papa from "papaparse";
import { z } from "zod";
import { Upload, Layers, Plus, Trash2, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "../stores/auth.store";
import { useDemo } from "../stores/demo.store";
import { request } from "../api/client";
import { useResource } from "../api/hooks";
import { Button } from "../components/ui/button";
import { Modal, DataTable, QueryState } from "../components/shared/common";
import type { Product } from "../types";
import { money } from "../lib/utils";
const csvSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(1),
  barcode: z.string().default(""),
  category: z.string().default("Abarrotes"),
  price: z.coerce.number().min(0),
  cost: z.coerce.number().min(0),
  stock: z.coerce.number().min(0),
  unit: z.enum(["pz", "kg", "lt"]).default("pz"),
});
export function ImportProducts() {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<z.infer<typeof csvSchema>[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const demo = useAuth((s) => s.demo);
  const store = useDemo();
  const qc = useQueryClient();
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Upload size={16} />
        Importar
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Importar productos CSV"
      >
        <p className="muted text-xs leading-6 mb-5">
          Columnas: name, sku, barcode, category, price, cost, stock, unit. Usa
          UTF-8, punto decimal y unidades pz, kg o lt. Las filas se validan
          antes de importar.
        </p>
        <input
          aria-label="Archivo CSV"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setError("");
            setRows([]);
            if (!file) return;
            if (file.size > 2_000_000) {
              setError("El archivo no debe superar 2 MB.");
              return;
            }
            Papa.parse<Record<string, string>>(file, {
              header: true,
              skipEmptyLines: true,
              complete: (result) => {
                if (result.errors.length) {
                  setError(result.errors[0].message);
                  return;
                }
                try {
                  const parsed = result.data.map((r, i) => {
                    const valid = csvSchema.safeParse(r);
                    if (!valid.success)
                      throw new Error(
                        `Fila ${i + 2}: ${valid.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join(", ")}`,
                      );
                    return valid.data;
                  });
                  const unique = new Set<string>();
                  for (const p of parsed) {
                    if (
                      unique.has(p.sku) ||
                      (store.products.some((x) => x.sku === p.sku) && demo)
                    )
                      throw new Error("SKU duplicado: " + p.sku);
                    unique.add(p.sku);
                  }
                  setRows(parsed);
                } catch (e) {
                  setError((e as Error).message);
                }
              },
              error: (e) => setError(e.message),
            });
          }}
        />
        {error && <p className="field-error mt-3">{error}</p>}
        {rows.length > 0 && (
          <p className="demo-note mt-4">
            {rows.length} productos válidos, listos para importar.
          </p>
        )}
        <Button
          className="w-full mt-5"
          disabled={!rows.length || busy}
          onClick={async () => {
            setBusy(true);
            try {
              if (demo)
                rows.forEach((p, i) =>
                  store.saveProduct({
                    ...p,
                    id: Date.now() + i,
                    emoji: "📦",
                    color: "#edf1e8",
                  }),
                );
              else
                await request("POST", "/products/import", { products: rows });
              qc.invalidateQueries({ queryKey: ["/products"] });
              setOpen(false);
              setRows([]);
              toast.success("Productos importados");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Importando…" : "Confirmar importación"}
        </Button>
      </Modal>
    </>
  );
}
interface Variant {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}
export function ProductVariants({ product }: { product: Product }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="icon-btn"
        title="Variantes"
        onClick={() => setOpen(true)}
      >
        <Layers size={15} />
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={`Variantes · ${product.name}`}
      >
        {open && <Variants product={product} />}
      </Modal>
    </>
  );
}
function Variants({ product }: { product: Product }) {
  const [editing, setEditing] = useState<Variant | null>(null);
  const demo = useAuth((s) => s.demo);
  const [local, setLocal] = useState<Variant[]>(() =>
    JSON.parse(localStorage.getItem("ultrapos-variants-" + product.id) || "[]"),
  );
  const qc = useQueryClient();
  const path = `/products/${product.id}/variants`;
  const { data, isLoading, error } = useResource<Variant[]>(path, local);
  function save(v: Variant[]) {
    setLocal(v);
    localStorage.setItem("ultrapos-variants-" + product.id, JSON.stringify(v));
  }
  return (
    <>
      <QueryState loading={isLoading} error={error} />
      <DataTable
        data={data?.data || []}
        columns={[
          { header: "Variante", accessorKey: "name" },
          { header: "SKU", accessorKey: "sku" },
          {
            header: "Precio",
            accessorKey: "price",
            cell: (c) => money(c.getValue()),
          },
          {
            header: "",
            id: "delete",
            cell: (c) => (
              <div className="flex gap-1">
                <button
                  className="icon-btn"
                  title="Editar variante"
                  onClick={() => setEditing(c.row.original)}
                >
                  <Pencil size={14} />
                </button>
                <button
                  title="Eliminar variante"
                  className="icon-btn"
                  onClick={async () => {
                    if (!confirm("¿Eliminar variante?")) return;
                    if (demo)
                      save(local.filter((v) => v.id !== c.row.original.id));
                    else
                      await request("DELETE", path + "/" + c.row.original.id);
                    qc.invalidateQueries({ queryKey: [path] });
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ),
          },
        ]}
      />
      <form
        key={editing?.id || "new"}
        className="mt-6"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          const v = {
            id: editing?.id || Date.now(),
            name: String(f.get("name")),
            sku: String(f.get("sku")),
            price: Number(f.get("price")),
            stock: 0,
          };
          if (demo)
            save(
              editing
                ? local.map((x) => (x.id === editing.id ? v : x))
                : [...local, v],
            );
          else
            await request(
              editing ? "PUT" : "POST",
              path + (editing ? "/" + editing.id : ""),
              v,
            );
          qc.invalidateQueries({ queryKey: [path] });
          toast.success(editing ? "Variante actualizada" : "Variante creada");
          setEditing(null);
          form.reset();
        }}
      >
        <div className="form-grid">
          <label>
            Nombre
            <input
              name="name"
              defaultValue={editing?.name}
              required
              placeholder="Talla, color, presentación…"
            />
          </label>
          <label>
            SKU
            <input name="sku" defaultValue={editing?.sku} required />
          </label>
          <label>
            Precio
            <input
              name="price"
              defaultValue={editing?.price}
              required
              type="number"
              min="0"
              step="0.01"
            />
          </label>
        </div>
        <Button>
          <Plus size={16} />
          {editing ? "Guardar cambios" : "Agregar variante"}
        </Button>
      </form>
    </>
  );
}
