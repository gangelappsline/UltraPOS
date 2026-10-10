import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../stores/auth.store";
import { useResource } from "../api/hooks";
import { request } from "../api/client";
import { useLocalRecords } from "../hooks/useLocalRecords";
import {
  PageTitle,
  DataTable,
  Modal,
  QueryState,
} from "../components/shared/common";
import { Button } from "../components/ui/button";
interface CatalogItem {
  id: number;
  name: string;
  symbol?: string;
  parent_id?: number;
  children?: CatalogItem[];
}
const categories = [
  "Abarrotes",
  "Bebidas",
  "Lácteos",
  "Panadería",
  "Frutas y verduras",
].map((name, i) => ({ id: i + 1, name }));
export function CatalogSettings() {
  const [tab, setTab] = useState("categories");
  const [edit, setEdit] = useState<CatalogItem | null | undefined>();
  const demo = useAuth((s) => s.demo);
  const qc = useQueryClient();
  const [local, setLocal] = useLocalRecords<Record<string, CatalogItem[]>>(
    "catalog",
    {
      categories,
      brands: [
        { id: 1, name: "Santa Clara" },
        { id: 2, name: "Bimbo" },
      ],
      units: [
        { id: 1, name: "Pieza", symbol: "pz" },
        { id: 2, name: "Kilogramo", symbol: "kg" },
        { id: 3, name: "Litro", symbol: "lt" },
      ],
    },
  );
  const path = tab === "categories" ? "/categories/tree" : "/" + tab;
  const { data, isLoading, error } = useResource<CatalogItem[]>(
    path,
    local[tab],
  );
  const flatten = (rows: CatalogItem[], depth = 0): CatalogItem[] =>
    rows.flatMap((r) => [
      { ...r, name: "— ".repeat(depth) + r.name },
      ...flatten(r.children || [], depth + 1),
    ]);
  return (
    <>
      <PageTitle
        title="Organiza tu catálogo"
        description="Categorías, marcas y unidades para un inventario en orden."
      >
        <Button onClick={() => setEdit(null)}>
          <Plus size={17} />
          Agregar
        </Button>
      </PageTitle>
      <div className="category-tabs">
        {[
          ["categories", "Categorías"],
          ["brands", "Marcas"],
          ["units", "Unidades de medida"],
        ].map(([id, title]) => (
          <button
            key={id}
            className={tab === id ? "selected" : ""}
            onClick={() => setTab(id)}
          >
            {title}
          </button>
        ))}
      </div>
      <section className="panel">
        <QueryState loading={isLoading} error={error} />
        <DataTable
          data={flatten(data?.data || [])}
          columns={[
            { header: "Nombre", accessorKey: "name" },
            ...(tab === "units"
              ? [{ header: "Símbolo", accessorKey: "symbol" }]
              : []),
            {
              header: "Acciones",
              id: "actions",
              cell: (c) => (
                <div className="flex gap-2">
                  <button
                    className="icon-btn"
                    title="Editar"
                    onClick={() => setEdit(c.row.original)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="icon-btn"
                    title="Eliminar"
                    onClick={async () => {
                      if (!confirm("¿Eliminar este registro del catálogo?"))
                        return;
                      if (demo)
                        setLocal((s) => ({
                          ...s,
                          [tab]: s[tab].filter(
                            (x) => x.id !== c.row.original.id,
                          ),
                        }));
                      else
                        await request("DELETE", `/${tab}/${c.row.original.id}`);
                      qc.invalidateQueries({ queryKey: [path] });
                      toast.success("Registro eliminado");
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={edit !== undefined}
        onClose={() => setEdit(undefined)}
        title={edit ? "Editar registro" : "Agregar al catálogo"}
      >
        <form
          key={edit?.id || "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const value = {
              id: edit?.id || Date.now(),
              name: String(f.get("name")),
              symbol: String(f.get("symbol") || ""),
              parent_id: Number(f.get("parent_id")) || undefined,
            };
            if (demo)
              setLocal((s) => ({
                ...s,
                [tab]: edit
                  ? s[tab].map((x) => (x.id === edit.id ? value : x))
                  : [...s[tab], value],
              }));
            else
              await request(
                edit ? "PUT" : "POST",
                `/${tab}${edit ? "/" + edit.id : ""}`,
                value,
              );
            qc.invalidateQueries({ queryKey: [path] });
            setEdit(undefined);
            toast.success("Catálogo actualizado");
          }}
        >
          <label>
            Nombre
            <input required name="name" defaultValue={edit?.name} />
          </label>
          {tab === "units" && (
            <label>
              Símbolo
              <input
                required
                name="symbol"
                defaultValue={edit?.symbol}
                placeholder="pz, kg, lt…"
              />
            </label>
          )}
          {tab === "categories" && (
            <label>
              Categoría padre
              <select name="parent_id" defaultValue={edit?.parent_id || ""}>
                <option value="">Ninguna (categoría principal)</option>
                {(data?.data || [])
                  .filter((x) => x.id !== edit?.id)
                  .map((x) => (
                    <option value={x.id} key={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <Button className="w-full mt-5">Guardar</Button>
        </form>
      </Modal>
    </>
  );
}
