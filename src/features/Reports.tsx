import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Download, CalendarDays, TrendingUp } from "lucide-react";
import { useResource } from "../api/hooks";
import { useDemo } from "../stores/demo.store";
import { useAuth } from "../stores/auth.store";
import { chartData } from "../lib/demo";
import { money } from "../lib/utils";
import {
  PageTitle,
  DataTable,
  downloadCSV,
  QueryState,
} from "../components/shared/common";
import { Button } from "../components/ui/button";
interface Report {
  total: number;
  count: number;
  average: number;
  chart: typeof chartData;
  rows: { name: string; quantity: number; total: number }[];
}
export function Reports() {
  const [type, setType] = useState("sales");
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-31");
  const demo = useAuth((s) => s.demo);
  const products = useDemo((s) => s.products);
  const demoReport: Report = {
    total: type === "profit" ? 8450 : type === "tax" ? 3427.66 : 24850.5,
    count: 156,
    average: 159.3,
    chart: chartData,
    rows: products.slice(0, 8).map((p, i) => ({
      name: p.name,
      quantity: 86 - i * 7,
      total: p.price * (86 - i * 7),
    })),
  };
  const { data, isLoading, error } = useResource<Report>(
    `/reports/${type}`,
    demoReport,
    { from, to },
  );
  const result = data?.data;
  return (
    <>
      <PageTitle
        title="Reportes"
        description="Decisiones inteligentes comienzan con información clara."
      >
        <Button
          variant="outline"
          disabled={!result}
          onClick={() => downloadCSV("reporte-" + type, result?.rows || [])}
        >
          <Download size={16} />
          Exportar reporte
        </Button>
      </PageTitle>
      <div className="report-toolbar">
        <div className="category-tabs">
          {[
            { id: "sales", name: "Ventas" },
            { id: "products/top-selling", name: "Productos" },
            { id: "profit", name: "Ganancias" },
            { id: "tax", name: "Impuestos" },
          ].map((t) => (
            <button
              key={t.id}
              className={type === t.id ? "selected" : ""}
              onClick={() => setType(t.id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <CalendarDays size={17} />
          <input
            aria-label="Desde"
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
          />
          <span className="muted">a</span>
          <input
            aria-label="Hasta"
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>
      {demo && (
        <div className="demo-note">
          Vista de demostración: los reportes muestran una muestra fija de
          octubre de 2026.
        </div>
      )}
      <QueryState loading={isLoading} error={error} />
      <div className="mini-stats">
        <div>
          <TrendingUp />
          <span>
            {type === "profit"
              ? "Ganancia neta"
              : type === "tax"
                ? "Impuestos recaudados"
                : "Ventas del período"}
            <strong>{money(result?.total || 0)}</strong>
          </span>
        </div>
        <div>
          <span>
            Transacciones<strong>{result?.count || 0}</strong>
          </span>
        </div>
        <div>
          <span>
            Ticket promedio<strong>{money(result?.average || 0)}</strong>
          </span>
        </div>
      </div>
      <section className="panel mb-6">
        <div className="panel-heading">
          <h3>
            {type === "products/top-selling"
              ? "Productos más vendidos"
              : "Evolución del período"}
          </h3>
        </div>
        <div className="report-chart">
          <ResponsiveContainer width="100%" height="100%">
            {type === "products/top-selling" ? (
              <BarChart data={result?.rows}>
                <CartesianGrid vertical={false} stroke="#edf0eb" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.split(" ").slice(0, 2).join(" ")}
                />
                <YAxis />
                <Tooltip />
                <Bar
                  dataKey="quantity"
                  name="Unidades vendidas"
                  fill="#789567"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            ) : (
              <AreaChart data={result?.chart}>
                <CartesianGrid
                  vertical={false}
                  stroke="#edf0eb"
                  strokeDasharray="4 4"
                />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => "$" + v / 1000 + "k"} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Area
                  isAnimationActive={false}
                  dataKey="actual"
                  name="Importe"
                  stroke="#668650"
                  fill="#edf3e7"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </section>
      <section className="panel">
        <div className="panel-heading">
          <h3>Detalle por producto</h3>
        </div>
        <DataTable
          data={result?.rows || []}
          columns={[
            { header: "Producto", accessorKey: "name" },
            { header: "Unidades vendidas", accessorKey: "quantity" },
            {
              header: "Importe",
              accessorKey: "total",
              cell: (c) => money(c.getValue()),
            },
          ]}
        />
      </section>
    </>
  );
}
