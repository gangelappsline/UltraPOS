import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useResource } from "../api/hooks";
import { request } from "../api/client";
import { useAuth } from "../stores/auth.store";
import {
  PageTitle,
  DataTable,
  Modal,
  QueryState,
} from "../components/shared/common";
import { Button } from "../components/ui/button";
interface RecordItem {
  id: number;
  name: string;
  email?: string;
  price?: number;
  status?: string;
  created_at?: string;
  action?: string;
}
export function AdminPanel() {
  const [tab, setTab] = useState("tenants");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<RecordItem | null | undefined>();
  const [local, setLocal] = useState<Record<string, RecordItem[]>>({
    tenants: [
      {
        id: 1,
        name: "La Esquina Market",
        status: "active",
        created_at: "2026-10-01",
      },
    ],
    plans: [{ id: 1, name: "Pro", price: 499, status: "active" }],
    users: [
      {
        id: 1,
        name: "Alejandro Martínez",
        email: "alejandro@example.com",
        status: "active",
      },
    ],
    "audit-logs": [
      {
        id: 1,
        name: "Sesión de demostración iniciada",
        action: "auth.login",
        created_at: "2026-10-10",
      },
    ],
  });
  const demo = useAuth((s) => s.demo);
  const qc = useQueryClient();
  const path = `/admin/${tab}`;
  const { data, isLoading, error } = useResource<RecordItem[]>(
    path,
    local[tab] || [],
    { page, per_page: 20 },
  );
  const labels: { [key: string]: string } = {
    tenants: "Negocios",
    plans: "Planes",
    users: "Usuarios",
    "audit-logs": "Auditoría",
  };
  return (
    <>
      <PageTitle
        title="Administración global"
        description="Gestiona los negocios, usuarios y planes de UltraPOS."
      >
        {tab !== "audit-logs" && (
          <Button onClick={() => setEdit(null)}>
            <Plus size={16} />
            Crear registro
          </Button>
        )}
      </PageTitle>
      <div className="category-tabs">
        {Object.entries(labels).map(([id, name]) => (
          <button
            className={tab === id ? "selected" : ""}
            onClick={() => {
              setTab(id);
              setPage(1);
            }}
            key={id}
          >
            {name}
          </button>
        ))}
      </div>
      <section className="panel">
        <QueryState loading={isLoading} error={error} />
        <DataTable
          data={data?.data || []}
          page={page}
          pages={data?.pagination?.last_page || 1}
          total={data?.pagination?.total}
          onPage={setPage}
          columns={[
            { header: "ID", accessorKey: "id" },
            { header: "Nombre / evento", accessorKey: "name" },
            {
              header: tab === "users" ? "Correo" : "Estado",
              accessorKey: tab === "users" ? "email" : "status",
            },
            { header: "Creado", accessorKey: "created_at" },
            {
              header: "Acciones",
              id: "actions",
              cell: (c) =>
                tab !== "audit-logs" && (
                  <div className="flex gap-2">
                    <button
                      title="Editar"
                      className="icon-btn"
                      onClick={() => setEdit(c.row.original)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      title="Eliminar"
                      className="icon-btn"
                      onClick={async () => {
                        if (
                          !confirm(
                            "¿Eliminar este registro? Esta acción no se puede deshacer.",
                          )
                        )
                          return;
                        if (demo)
                          setLocal((s) => ({
                            ...s,
                            [tab]: s[tab].filter(
                              (x) => x.id !== c.row.original.id,
                            ),
                          }));
                        else
                          await request(
                            "DELETE",
                            path + "/" + c.row.original.id,
                          );
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
        title={`${edit ? "Editar" : "Crear"} registro`}
      >
        <form
          key={edit?.id || "new"}
          onSubmit={async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(e.currentTarget));
            const item = {
              ...values,
              id: edit?.id || Date.now(),
              created_at: edit?.created_at || new Date().toISOString(),
            } as unknown as RecordItem;
            if (demo)
              setLocal((s) => ({
                ...s,
                [tab]: edit
                  ? s[tab].map((x) => (x.id === edit.id ? item : x))
                  : [item, ...s[tab]],
              }));
            else
              await request(
                edit ? "PUT" : "POST",
                path + (edit ? "/" + edit.id : ""),
                values,
              );
            qc.invalidateQueries({ queryKey: [path] });
            setEdit(undefined);
            toast.success("Registro guardado");
          }}
        >
          <label>
            Nombre
            <input name="name" required defaultValue={edit?.name} />
          </label>
          {tab === "users" && (
            <>
              <label>
                Correo
                <input
                  type="email"
                  name="email"
                  required
                  defaultValue={edit?.email}
                />
              </label>
              <label>
                Rol
                <select name="role">
                  <option value="seller">Vendedor</option>
                  <option value="business">Dueño de negocio</option>
                  <option value="admin">Administrador global</option>
                </select>
              </label>
            </>
          )}
          {tab === "plans" && (
            <label>
              Precio mensual
              <input
                name="price"
                required
                type="number"
                min="0"
                step="0.01"
                defaultValue={edit?.price}
              />
            </label>
          )}
          {tab === "tenants" && (
            <label>
              Tipo de negocio
              <select name="business_type">
                <option value="tienda">Tienda</option>
                <option value="farmacia">Farmacia</option>
                <option value="restaurante">Restaurante</option>
              </select>
            </label>
          )}
          <label>
            Estado
            <select name="status" defaultValue={edit?.status || "active"}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
          <Button className="w-full mt-5">Guardar registro</Button>
        </form>
      </Modal>
    </>
  );
}
