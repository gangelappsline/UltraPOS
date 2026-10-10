import { useResource } from "../api/hooks";
import { DataTable, QueryState } from "../components/shared/common";
import { money } from "../lib/utils";
interface Invoice {
  id: number;
  number: string;
  date: string;
  amount: number;
  status: string;
}
export function Billing() {
  const { data, isLoading, error } = useResource<Invoice[]>(
    "/subscriptions/invoices",
    [
      {
        id: 1,
        number: "UP-2026-010",
        date: "2026-10-01",
        amount: 499,
        status: "Pagada",
      },
      {
        id: 2,
        number: "UP-2026-009",
        date: "2026-09-01",
        amount: 499,
        status: "Pagada",
      },
    ],
  );
  return (
    <section className="panel mt-7">
      <div className="panel-heading">
        <h3>Historial de facturación</h3>
      </div>
      <QueryState loading={isLoading} error={error} />
      <DataTable
        data={data?.data || []}
        columns={[
          { header: "Factura", accessorKey: "number" },
          { header: "Fecha", accessorKey: "date" },
          {
            header: "Importe",
            accessorKey: "amount",
            cell: (c) => money(c.getValue()),
          },
          {
            header: "Estado",
            accessorKey: "status",
            cell: (c) => (
              <span className="badge badge-green">{c.getValue()}</span>
            ),
          },
        ]}
      />
    </section>
  );
}
