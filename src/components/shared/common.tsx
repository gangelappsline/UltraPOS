import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import type { ReactNode } from "react";
import { useAuth } from "../../stores/auth.store";
import type { Role } from "../../types";
export function Can({
  roles = ["business", "admin"],
  children,
}: {
  roles?: Role[];
  children: ReactNode;
}) {
  return roles.includes(useAuth((s) => s.user?.role) || "seller") ? (
    <>{children}</>
  ) : null;
}
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content">
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-semibold">
              {title}
            </Dialog.Title>
            <Dialog.Close className="icon-btn" aria-label="Cerrar">
              <X size={20} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">
            Completa los datos para continuar.
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="flex gap-3 flex-wrap">{children}</div>
    </div>
  );
}
export function DataTable<T>({
  data,
  columns,
  page = 1,
  pages = 1,
  total,
  onPage,
}: {
  data: T[];
  columns: ColumnDef<T, any>[];
  page?: number;
  pages?: number;
  total?: number;
  onPage?: (p: number) => void;
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pages,
  });
  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            {table.getHeaderGroups().map((g) => (
              <tr key={g.id}>
                {g.headers.map((h) => (
                  <th key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((r) => (
              <tr key={r.id}>
                {r.getVisibleCells().map((c) => (
                  <td key={c.id}>
                    {flexRender(c.column.columnDef.cell, c.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!data.length && (
          <div className="empty">
            <Inbox />
            <p>No hay resultados para mostrar</p>
          </div>
        )}
      </div>
      {onPage && (
        <div className="table-footer">
          <span>
            {total ?? data.length} resultados · Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            <button
              className="icon-btn"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="icon-btn"
              aria-label="Página siguiente"
              disabled={page >= pages}
              onClick={() => onPage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
export function QueryState({
  loading,
  error,
}: {
  loading: boolean;
  error: Error | null;
}) {
  return loading ? (
    <div className="empty animate-pulse">Cargando datos…</div>
  ) : error ? (
    <div className="error-box">
      {error.message}{" "}
      <button onClick={() => window.location.reload()}>Reintentar</button>
    </div>
  ) : null;
}
export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] || {});
  const csv = [keys, ...rows.map((r) => keys.map((k) => r[k]))]
    .map((row) =>
      row
        .map(
          (v) =>
            '"' +
            (typeof v === "string" && /^[=+\-@\t\r]/.test(v)
              ? "'" + v
              : String(v ?? "")
            ).replaceAll('"', '""') +
            '"',
        )
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name + ".csv";
  a.click();
  URL.revokeObjectURL(url);
}
