import { useLocalRecords } from "../hooks/useLocalRecords";
import { Billing } from "./Billing";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Download,
  Eye,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Check,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../stores/auth.store";
import { useDemo } from "../stores/demo.store";
import { useResource } from "../api/hooks";
import { request } from "../api/client";
import { money } from "../lib/utils";
import {
  PageTitle,
  DataTable,
  Modal,
  QueryState,
  Can,
  downloadCSV,
} from "../components/shared/common";
import { Button } from "../components/ui/button";
import type { Customer, Supplier, Sale } from "../types";
export function Contacts({ kind }: { kind: "customers" | "suppliers" }) {
  const customer = kind === "customers";
  const [params] = useSearchParams();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState<Customer | Supplier | null | undefined>(
    params.has("new") ? null : undefined,
  );
  const [detail, setDetail] = useState<Customer | Supplier | null>(null);
  const [amount, setAmount] = useState("");
  const store = useDemo();
  const demo = useAuth((s) => s.demo);
  const qc = useQueryClient();
  const { data, isLoading, error } = useResource<(Customer | Supplier)[]>(
    "/" + kind,
    store[kind],
    { page, per_page: 10, search },
  );
  const filtered = (data?.data || []).filter(
    (c) =>
      !demo ||
      (c.name + " " + c.email).toLowerCase().includes(search.toLowerCase()),
  );
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    const contact = {
      ...values,
      id: edit?.id || Date.now(),
      balance: edit && "balance" in edit ? edit.balance : 0,
    } as unknown as Customer;
    if (demo) store.saveContact(kind, contact);
    else
      await request(
        edit ? "PUT" : "POST",
        `/${kind}${edit ? "/" + edit.id : ""}`,
        values,
      );
    qc.invalidateQueries({ queryKey: ["/" + kind] });
    setEdit(undefined);
    toast.success("Datos guardados");
  }
  return (
    <>
      <PageTitle
        title={customer ? "Clientes" : "Proveedores"}
        description={
          customer
            ? "Conoce a tus clientes. Construye relaciones que duran."
            : "Los aliados que mantienen tu negocio en movimiento."
        }
      >
        <Button onClick={() => setEdit(null)}>
          <Plus size={17} />
          {customer ? "Nuevo cliente" : "Nuevo proveedor"}
        </Button>
      </PageTitle>
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre o correo…"
            />
          </div>
          <Button
            variant="outline"
            onClick={() =>
              downloadCSV(
                kind,
                filtered.map((c) => ({ ...c })),
              )
            }
          >
            <Download size={16} />
            Exportar
          </Button>
        </div>
        <QueryState loading={isLoading} error={error} />
        <DataTable<Customer | Supplier>
          data={demo ? filtered.slice((page - 1) * 10, page * 10) : filtered}
          page={page}
          pages={
            demo
              ? Math.max(1, Math.ceil(filtered.length / 10))
              : data?.pagination?.last_page || 1
          }
          total={data?.pagination?.total || filtered.length}
          onPage={setPage}
          columns={[
            {
              header: "Nombre",
              accessorKey: "name",
              cell: (c) => (
                <div className="customer-cell">
                  <span className="avatar small">
                    {c.getValue().slice(0, 2).toUpperCase()}
                  </span>
                  <strong>{c.getValue()}</strong>
                </div>
              ),
            },
            { header: "Correo electrónico", accessorKey: "email" },
            { header: "Teléfono", accessorKey: "phone" },
            ...(customer
              ? [
                  {
                    header: "Saldo pendiente",
                    id: "balance",
                    cell: ({
                      row,
                    }: {
                      row: { original: Customer | Supplier };
                    }) =>
                      money(
                        "balance" in row.original ? row.original.balance : 0,
                      ),
                  },
                ]
              : []),
            {
              header: "Acciones",
              id: "actions",
              cell: (c) => (
                <div className="flex gap-2">
                  <button
                    title="Ver detalle"
                    className="icon-btn"
                    onClick={() => setDetail(c.row.original)}
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    title="Editar"
                    className="icon-btn"
                    onClick={() => setEdit(c.row.original)}
                  >
                    <Pencil size={16} />
                  </button>
                  <Can>
                    <button
                      title="Eliminar"
                      className="icon-btn"
                      onClick={async () => {
                        if (!confirm("¿Eliminar este contacto?")) return;
                        if (demo) store.deleteContact(kind, c.row.original.id);
                        else
                          await request(
                            "DELETE",
                            `/${kind}/${c.row.original.id}`,
                          );
                        qc.invalidateQueries();
                        toast.success("Contacto eliminado");
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </Can>
                </div>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={edit !== undefined}
        onClose={() => setEdit(undefined)}
        title={`${edit ? "Editar" : "Agregar"} ${customer ? "cliente" : "proveedor"}`}
      >
        <form key={edit?.id || "new"} onSubmit={save}>
          <label>
            Nombre
            <input
              name="name"
              required
              minLength={2}
              defaultValue={edit?.name}
            />
          </label>
          <label>
            Correo electrónico
            <input
              name="email"
              type="email"
              required
              defaultValue={edit?.email}
            />
          </label>
          <label>
            Teléfono
            <input name="phone" required defaultValue={edit?.phone} />
          </label>
          <Button className="w-full mt-6">Guardar</Button>
        </form>
      </Modal>
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name || "Detalle"}
      >
        <p className="muted mb-5">
          {detail?.email} · {detail?.phone}
        </p>
        {detail && customer && (
          <>
            <div className="checkout-total">
              <small>Saldo pendiente</small>
              <strong>{money("balance" in detail ? detail.balance : 0)}</strong>
            </div>
            <h3 className="font-semibold mb-3">Historial de compras</h3>
            {demo ? (
              store.sales
                .filter((s) => s.customer === detail.name)
                .slice(0, 5)
                .map((s) => (
                  <div className="receipt-line" key={s.id}>
                    <span>#{s.number}</span>
                    <strong>{money(s.total)}</strong>
                  </div>
                ))
            ) : (
              <CustomerHistory id={detail.id} />
            )}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (demo) store.pay(detail.id, +amount);
                else
                  await request("POST", `/customers/${detail.id}/payment`, {
                    amount: +amount,
                  });
                qc.invalidateQueries();
                toast.success("Pago registrado");
                setDetail(null);
                setAmount("");
              }}
            >
              <label className="mt-4">
                Registrar abono
                <input
                  type="number"
                  min="0.01"
                  max={"balance" in detail ? detail.balance : undefined}
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <Button className="w-full mt-4">Registrar pago</Button>
            </form>
          </>
        )}
      </Modal>
    </>
  );
}
function CustomerHistory({ id }: { id: number }) {
  const { data, isLoading, error } = useResource<Sale[]>(
    `/customers/${id}/sales`,
    [],
  );
  return (
    <>
      <QueryState loading={isLoading} error={error} />
      {data?.data.map((s) => (
        <div className="receipt-line" key={s.id}>
          {s.number}
          <strong>{money(s.total)}</strong>
        </div>
      ))}
    </>
  );
}
export function Sales() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const qc = useQueryClient();
  const store = useDemo();
  const demo = useAuth((s) => s.demo);
  const { data, isLoading, error } = useResource("/sales", store.sales, {
    page,
    per_page: 10,
    search,
  });
  const all = (data?.data || []).filter(
    (s) =>
      !demo ||
      (s.number + " " + s.customer)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Ventas"
        description="Cada transacción, con todos sus detalles."
      >
        <Button
          variant="outline"
          onClick={() =>
            downloadCSV(
              "ventas",
              all.map((s) => ({
                folio: s.number,
                cliente: s.customer,
                total: s.total,
                fecha: s.created_at,
                estado: s.status,
              })),
            )
          }
        >
          <Download size={16} />
          Exportar ventas
        </Button>
      </PageTitle>
      <section className="panel">
        <div className="list-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              placeholder="Buscar por folio o cliente…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <QueryState loading={isLoading} error={error} />
        <DataTable<Sale>
          data={demo ? all.slice((page - 1) * 10, page * 10) : all}
          page={page}
          pages={
            demo
              ? Math.max(1, Math.ceil(all.length / 10))
              : data?.pagination?.last_page || 1
          }
          total={data?.pagination?.total || all.length}
          onPage={setPage}
          columns={[
            {
              header: "Folio",
              accessorKey: "number",
              cell: (c) => <strong className="sale-id">#{c.getValue()}</strong>,
            },
            { header: "Cliente", accessorKey: "customer" },
            {
              header: "Fecha",
              accessorKey: "created_at",
              cell: (c) => new Date(c.getValue()).toLocaleDateString("es-MX"),
            },
            { header: "Método de pago", accessorKey: "payment_method" },
            {
              header: "Total",
              accessorKey: "total",
              cell: (c) => money(c.getValue()),
            },
            {
              header: "Estado",
              accessorKey: "status",
              cell: (c) => (
                <span
                  className={`badge ${c.getValue() === "Completada" ? "badge-green" : "badge-neutral"}`}
                >
                  {c.getValue()}
                </span>
              ),
            },
            {
              header: "",
              id: "actions",
              cell: (c) => (
                <button
                  className="icon-btn"
                  title="Ver venta"
                  onClick={() => setSelected(c.row.original)}
                >
                  <Eye size={17} />
                </button>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Venta #${selected?.number}`}
      >
        <p>{selected?.customer}</p>
        <p className="muted mb-4">
          {selected?.created_at &&
            new Date(selected.created_at).toLocaleString("es-MX")}
        </p>
        {selected?.items?.map((i) => (
          <div className="receipt-line" key={i.product.id}>
            <span>
              {i.quantity} × {i.product.name}
            </span>
            <b>{money(i.product.price * i.quantity)}</b>
          </div>
        ))}
        <div className="receipt-line grand-total">
          Total<strong>{money(selected?.total || 0)}</strong>
        </div>
        <Button
          className="w-full mt-5"
          onClick={async () => {
            if (demo) window.print();
            else if (selected) {
              const result = await request<{ url: string }>(
                "GET",
                `/sales/${selected.id}/receipt`,
              );
              window.open(result.data.url, "_blank", "noopener");
            }
          }}
        >
          Ver recibo
        </Button>
        <Can>
          {selected?.status === "Completada" && (
            <Button
              variant="destructive"
              className="w-full mt-3"
              onClick={async () => {
                if (
                  !selected ||
                  !confirm("¿Cancelar esta venta y devolver las existencias?")
                )
                  return;
                if (demo) store.cancelSale(selected.id);
                else await request("POST", `/sales/${selected.id}/cancel`);
                qc.invalidateQueries();
                setSelected(null);
                toast.success("Venta cancelada");
              }}
            >
              Cancelar venta
            </Button>
          )}
        </Can>
      </Modal>
    </>
  );
}
export function Cash() {
  const demo = useAuth((s) => s.demo);
  const store = useDemo();
  const qc = useQueryClient();
  const [action, setAction] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [movements, setMovements] = useLocalRecords<
    { id: number; type: string; amount: number; note: string }[]
  >("cash-movements", []);
  const { data, isLoading, error } = useResource<{
    id: number;
    balance: number;
    status: string;
  } | null>(
    "/cash-registers/current",
    store.cash === null ? null : { id: 1, balance: store.cash, status: "open" },
  );
  const { data: movementData } = useResource(
    "/cash-registers/movements",
    movements,
  );
  const cash = data?.data;
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (demo) {
      store.setCash(
        action === "Abrir caja"
          ? +amount
          : action === "Cerrar caja"
            ? null
            : (store.cash || 0) + (action === "Retiro" ? -1 : 1) * +amount,
      );
      setMovements((s) => [
        { id: Date.now(), type: action, amount: +amount, note },
        ...s,
      ]);
    } else
      await request(
        "POST",
        action === "Abrir caja"
          ? "/cash-registers/open"
          : action === "Cerrar caja"
            ? `/cash-registers/${cash?.id}/close`
            : `/cash-registers/${cash?.id}/movements`,
        {
          amount: +amount,
          type: action === "Retiro" ? "withdrawal" : "income",
          notes: note,
        },
      );
    qc.invalidateQueries();
    toast.success("Movimiento registrado");
    setAction("");
    setAmount("");
    setNote("");
  }
  return (
    <>
      <PageTitle
        title="Gestión de caja"
        description="La tranquilidad de tener cada movimiento bajo control."
      >
        <Button onClick={() => setAction(cash ? "Cerrar caja" : "Abrir caja")}>
          <Wallet size={17} />
          {cash ? "Cerrar caja" : "Abrir caja"}
        </Button>
      </PageTitle>
      <QueryState loading={isLoading} error={error} />
      <section className="cash-hero panel">
        <span className="empty-icon">
          <Wallet size={30} />
        </span>
        <div>
          <span className={`badge ${cash ? "badge-green" : "badge-neutral"}`}>
            {cash ? "Caja abierta" : "Caja cerrada"}
          </span>
          <h2>{money(cash?.balance || 0)}</h2>
          <p className="muted">Saldo actual en caja</p>
        </div>
        <div className="flex gap-3 ml-auto">
          <Button
            disabled={!cash}
            variant="outline"
            onClick={() => setAction("Ingreso")}
          >
            <ArrowDownLeft size={17} />
            Ingreso
          </Button>
          <Button
            disabled={!cash}
            variant="outline"
            onClick={() => setAction("Retiro")}
          >
            <ArrowUpRight size={17} />
            Retiro
          </Button>
        </div>
      </section>
      <section className="panel mt-6">
        <div className="panel-heading">
          <h3>Movimientos de esta sesión</h3>
        </div>
        <DataTable
          data={movementData?.data || []}
          columns={[
            { header: "Tipo", accessorKey: "type" },
            { header: "Concepto", accessorKey: "note" },
            {
              header: "Monto",
              accessorKey: "amount",
              cell: (c) => money(c.getValue()),
            },
          ]}
        />
      </section>
      <Modal open={!!action} onClose={() => setAction("")} title={action}>
        <form onSubmit={submit}>
          <label>
            {action === "Cerrar caja"
              ? "Efectivo contado"
              : action === "Abrir caja"
                ? "Fondo inicial"
                : "Monto"}
            <input
              required
              type="number"
              min="0"
              max={action === "Retiro" ? cash?.balance : undefined}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label>
            Notas
            <input
              required
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <Button className="w-full mt-6">Confirmar</Button>
        </form>
      </Modal>
    </>
  );
}
export function Profile() {
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <PageTitle
        title="Mi perfil"
        description="Tu información y las preferencias de tu cuenta."
      />
      <section className="panel profile-panel">
        <div className="profile-top">
          <span className="avatar large">
            {auth.user?.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2>{auth.user?.name}</h2>
            <span className="badge badge-green">{auth.user?.role}</span>
          </div>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const values = Object.fromEntries(new FormData(e.currentTarget));
              if (auth.demo) {
                useAuth.setState({ user: { ...auth.user!, ...values } });
                toast.success("Perfil de demostración actualizado");
              } else {
                const result = await request<typeof auth.user>(
                  "PUT",
                  "/auth/profile",
                  values,
                );
                useAuth.setState({ user: result.data });
                toast.success("Perfil actualizado");
              }
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="form-grid">
            <label>
              Nombre completo
              <input name="name" required defaultValue={auth.user?.name} />
            </label>
            <label>
              Correo electrónico
              <input
                name="email"
                type="email"
                required
                defaultValue={auth.user?.email}
              />
            </label>
          </div>
          <Button className="mt-6" disabled={busy}>
            Guardar cambios
          </Button>
        </form>
      </section>
    </>
  );
}
export function Subscription() {
  const demo = useAuth((s) => s.demo);
  const [plan, setPlan] = useLocalRecords("subscription", "Pro");
  const [confirmPlan, setConfirmPlan] = useState("");
  const { data, isLoading, error } = useResource("/subscriptions/current", {
    name: plan,
    price: 499,
    status: "active",
  });
  return (
    <>
      <PageTitle
        title="Mi suscripción"
        description="El plan perfecto para cada etapa de tu negocio."
      />
      <QueryState loading={isLoading} error={error} />
      <div className="subscription-banner">
        <ShieldCheck size={30} />
        <div>
          <h2>Tu negocio está en el plan {data?.data.name}</h2>
          <p>Todo lo que necesitas para seguir creciendo.</p>
        </div>
        <span className="badge badge-green">Suscripción activa</span>
      </div>
      <div className="plan-grid">
        {[
          {
            name: "Esencial",
            price: 199,
            features: [
              "1 sucursal",
              "Catálogo de productos",
              "Punto de venta",
              "Reportes de ventas",
            ],
          },
          {
            name: "Pro",
            price: 499,
            features: [
              "Hasta 3 sucursales",
              "Todo en Esencial",
              "Control de inventario",
              "CRM y cuentas de clientes",
              "Reportes avanzados",
            ],
          },
          {
            name: "Business",
            price: 999,
            features: [
              "Sucursales ilimitadas",
              "Todo en Pro",
              "Usuarios ilimitados",
              "Soporte prioritario",
              "Administración centralizada",
            ],
          },
        ].map((p) => (
          <section
            className={`panel pricing-card ${p.name === "Pro" ? "recommended" : ""}`}
            key={p.name}
          >
            {p.name === "Pro" && (
              <span className="plan-tag">EL FAVORITO DE LOS NEGOCIOS</span>
            )}
            <h2>{p.name}</h2>
            <p>
              <strong>{money(p.price)}</strong>
              <span>/ mes</span>
            </p>
            <ul>
              {p.features.map((f) => (
                <li key={f}>
                  <Check size={16} />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              variant={p.name === "Pro" ? "default" : "outline"}
              disabled={p.name === data?.data.name}
              className="w-full"
              onClick={() => setConfirmPlan(p.name)}
            >
              {p.name === data?.data.name
                ? "Tu plan actual"
                : "Elegir " + p.name}
            </Button>
          </section>
        ))}
      </div>
      <Billing />
      <Modal
        open={!!confirmPlan}
        onClose={() => setConfirmPlan("")}
        title="Confirmar cambio de plan"
      >
        <p className="muted mb-5">
          Vas a cambiar al plan {confirmPlan}. Revisa el costo mensual antes de
          confirmar.
        </p>
        <Button
          onClick={async () => {
            if (demo) {
              setPlan(confirmPlan);
              toast.success("Plan de demostración actualizado");
            } else {
              await request("POST", "/subscriptions/upgrade", {
                plan: confirmPlan.toLowerCase(),
              });
              toast.success("Solicitud de cambio enviada");
            }
            setConfirmPlan("");
          }}
        >
          Confirmar cambio
        </Button>
      </Modal>
    </>
  );
}
interface Purchase {
  id: number;
  supplier: string;
  total: number;
  status: string;
  product_id: number;
  quantity: number;
}
export function Purchases() {
  const demo = useAuth((s) => s.demo);
  const store = useDemo();
  const qc = useQueryClient();
  const [local, setLocal] = useLocalRecords<Purchase[]>("purchases", []);
  const [open, setOpen] = useState(false);
  const { data, isLoading, error } = useResource("/purchases", local);
  const { data: products } = useResource("/products", store.products);
  const { data: suppliers } = useResource("/suppliers", store.suppliers);
  return (
    <>
      <PageTitle
        title="Compras"
        description="Planifica tus pedidos y mantén tu inventario al día."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} />
          Nueva compra
        </Button>
      </PageTitle>
      <section className="panel">
        <QueryState loading={isLoading} error={error} />
        <DataTable<Purchase>
          data={data?.data || []}
          columns={[
            {
              header: "Orden",
              accessorKey: "id",
              cell: (c) => "OC-" + String(c.getValue()).slice(-5),
            },
            { header: "Proveedor", accessorKey: "supplier" },
            {
              header: "Total",
              accessorKey: "total",
              cell: (c) => money(c.getValue()),
            },
            {
              header: "Estado",
              accessorKey: "status",
              cell: (c) => (
                <span className="badge badge-green">{c.getValue()}</span>
              ),
            },
            {
              header: "Acción",
              id: "action",
              cell: (c) => (
                <Button
                  variant="outline"
                  disabled={c.row.original.status === "Recibida"}
                  onClick={async () => {
                    const p = c.row.original;
                    if (!confirm("¿Confirmar recepción de mercancía?")) return;
                    if (demo) {
                      const product = store.products.find(
                        (x) => x.id === p.product_id,
                      );
                      if (product)
                        store.saveProduct({
                          ...product,
                          stock: product.stock + p.quantity,
                        });
                      setLocal((s) =>
                        s.map((x) =>
                          x.id === p.id ? { ...x, status: "Recibida" } : x,
                        ),
                      );
                    } else await request("POST", `/purchases/${p.id}/receive`);
                    qc.invalidateQueries();
                    toast.success("Mercancía recibida");
                  }}
                >
                  Recibir mercancía
                </Button>
              ),
            },
          ]}
        />
      </section>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva orden de compra"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const p = {
              id: Date.now(),
              supplier: String(f.get("supplier")),
              product_id: Number(f.get("product")),
              quantity: Number(f.get("quantity")),
              total: Number(f.get("quantity")) * Number(f.get("cost")),
              status: "Pendiente",
            };
            if (demo) setLocal((s) => [p, ...s]);
            else
              await request("POST", "/purchases", {
                supplier_id: suppliers?.data.find((s) => s.name === p.supplier)
                  ?.id,
                items: [
                  {
                    product_id: p.product_id,
                    quantity: p.quantity,
                    cost: Number(f.get("cost")),
                  },
                ],
              });
            qc.invalidateQueries();
            setOpen(false);
            toast.success("Orden creada");
          }}
        >
          <label>
            Proveedor
            <select required name="supplier">
              {suppliers?.data.map((s) => (
                <option key={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label>
            Producto
            <select required name="product">
              {products?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Cantidad
              <input
                name="quantity"
                required
                type="number"
                min="0.001"
                step="0.001"
              />
            </label>
            <label>
              Costo unitario
              <input name="cost" required type="number" min="0" step="0.01" />
            </label>
          </div>
          <Button className="w-full mt-6">Crear orden</Button>
        </form>
      </Modal>
    </>
  );
}
export function Help() {
  return (
    <>
      <PageTitle
        title="Centro de ayuda"
        description="Estamos aquí para ayudarte a aprovechar UltraPOS."
      />
      <section className="panel help-panel">
        {[
          [
            "¿Cómo registro mi primera venta?",
            "Abre Punto de venta, selecciona tus productos, asigna un cliente y presiona Cobrar. Elige el método de pago y confirma la operación.",
          ],
          [
            "¿Cómo ajusto el inventario?",
            "En Productos, usa el botón Ajustar stock junto al producto. Introduce una cantidad positiva para entradas o negativa para salidas y agrega un motivo.",
          ],
          [
            "¿Qué es el modo demostración?",
            "Permite explorar el sistema con datos de ejemplo guardados en este navegador. No crea ventas, envía correos ni modifica datos en el servidor.",
          ],
          [
            "¿Cómo cambio de negocio?",
            "Utiliza el selector debajo del logotipo. El carrito se vacía al cambiar de negocio para evitar mezclar productos.",
          ],
        ].map(([q, a]) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </section>
    </>
  );
}
