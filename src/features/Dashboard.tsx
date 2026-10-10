import { ProductImage } from "../components/shared/ProductImage";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  CalendarDays,
  ChevronDown,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  Ellipsis,
  AlertTriangle,
  ScanLine,
  Truck,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
import type { Sale } from "../types";
export function Dashboard() {
  const [period, setPeriod] = useState("Este mes");
  const demo = useDemo();
  const auth = useAuth();
  const { data: sales } = useResource("/sales", demo.sales, { per_page: 5 });
  const {
    data: stats,
    isLoading,
    error,
  } = useResource(
    "/dashboard",
    {
      revenue: 24850.5,
      sales: 156,
      ticket: 159.3,
      customers: 38,
      chart: chartData,
      top_products: [0, 2, 1, 4, 5]
        .map((index, i) => ({
          product: demo.products[index],
          quantity: [86, 72, 65, 48, 42][i],
          total: (demo.products[index]?.price || 0) * [86, 72, 65, 48, 42][i],
        }))
        .filter((x) => x.product),
    },
    { period },
  );
  const { data: catalog } = useResource("/products", demo.products, {
    per_page: 100,
  });
  const data = stats?.data;
  const low = (catalog?.data || []).filter((p) => p.stock < 10);
  const visibleChart =
    period === "Últimos 7 días"
      ? data?.chart?.slice(-7)
      : period === "Hoy"
        ? data?.chart?.slice(-1)
        : data?.chart;
  return (
    <>
      <PageTitle
        title="Resumen de tu negocio"
        description="Todo lo que necesitas saber, en un solo lugar."
      >
        <div className="date-select">
          <CalendarDays size={16} />
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option>Este mes</option>
            <option>Últimos 7 días</option>
            <option>Hoy</option>
          </select>
          <ChevronDown size={14} />
        </div>
        <Button asChild>
          <Link to="/pos">
            <Plus size={17} />
            Nueva venta
          </Link>
        </Button>
      </PageTitle>
      <section className="welcome-banner">
        <div>
          <div className="eyebrow">UN BUEN DÍA PARA CRECER</div>
          <h2>
            ¡Hola, {auth.user?.name.split(" ")[0] || "Alejandro"}!{" "}
            <span className="wave">☀</span>
          </h2>
          <p>Tu negocio está en movimiento. Vamos por un gran día.</p>
          <div className="welcome-date">
            <span className="status-dot" />{" "}
            {format(
              auth.demo ? new Date(2026, 9, 10) : new Date(),
              "EEEE, d 'de' MMMM 'de' yyyy",
              { locale: es },
            )}{" "}
            <span className="vertical-divider" />{" "}
            {auth.user?.businesses?.find((b) => b.id === auth.businessId)
              ?.name || "Mi negocio"}
          </div>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="art-circle" />
          <div className="art-dots">✦</div>
          <div className="mini-chart">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="art-badge">
            <TrendingUp size={26} />
          </div>
          <div className="art-receipt">
            <div className="receipt-logo">u.</div>
            <div />
            <div />
            <div />
            <hr />
            <b>✓</b>
          </div>
          <span className="art-star">✧</span>
        </div>
      </section>
      <QueryState loading={isLoading} error={error} />
      <div className="kpi-grid">
        {[
          {
            label: "Ventas totales",
            value: money(data?.revenue || 0),
            change: "+12.8%",
            icon: DollarSign,
            desc: "vs. mes anterior",
            spark: [12, 18, 15, 25, 21, 29, 23, 36, 31, 44],
          },
          {
            label: "Ventas realizadas",
            value: String(data?.sales || 0),
            change: "+8.2%",
            icon: ShoppingBag,
            desc: "vs. mes anterior",
            spark: [12, 19, 16, 24, 21, 29, 28, 38, 34, 43],
          },
          {
            label: "Ticket promedio",
            value: money(data?.ticket || 0),
            change: "+4.3%",
            icon: Package,
            desc: "vs. mes anterior",
            spark: [22, 17, 28, 21, 33, 27, 37, 32, 41, 43],
          },
          {
            label: "Nuevos clientes",
            value: String(data?.customers || 0),
            change: "+16.4%",
            icon: Users,
            desc: "vs. mes anterior",
            spark: [10, 17, 15, 26, 22, 32, 28, 40, 36, 45],
          },
        ].map((k, i) => (
          <section className="kpi-card" key={k.label}>
            <div className="kpi-label">
              {k.label}
              <span className={`kpi-icon tone-${i}`}>
                <k.icon size={17} />
              </span>
            </div>
            <div className="kpi-value">
              {k.value}
              <svg className="spark" viewBox="0 0 100 45">
                <path
                  d={`M0,45 ${k.spark.map((v, j) => `L${j * 11},${45 - v * 0.65}`).join(" ")} L99,45Z`}
                  fill="#edf4e9"
                />
                <polyline
                  points={k.spark
                    .map((v, j) => `${j * 11},${45 - v * 0.65}`)
                    .join(" ")}
                  fill="none"
                  stroke="#88a975"
                  strokeWidth="1.8"
                />
              </svg>
            </div>
            <div className="kpi-change">
              <span>
                <ArrowUpRight size={13} />
                {auth.demo ? k.change : "—"}
              </span>
              {k.desc}
            </div>
          </section>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <h3>Resumen de ventas</h3>
              <p>Así ha crecido tu negocio este mes</p>
            </div>
            <button
              className="icon-btn"
              title="Exportar gráfica"
              onClick={() => downloadCSV("ventas-diarias", visibleChart || [])}
            >
              <Ellipsis size={20} />
            </button>
          </div>
          <div className="chart-summary">
            <div>
              <strong>{money(data?.revenue || 0)}</strong>
              <span className="growth-pill">
                <ArrowUpRight size={13} />
                {auth.demo ? "12.8%" : "—"}
              </span>
            </div>
            <div className="chart-legend">
              <span>
                <i />
                Este mes
              </span>
              <span>
                <i />
                Mes anterior
              </span>
            </div>
          </div>
          <div className="sales-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visibleChart}
                margin={{ top: 15, right: 8, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#739861" stopOpacity={0.23} />
                    <stop offset="100%" stopColor="#739861" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="#edf0eb"
                  strokeDasharray="3 4"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#90968b", fontSize: 11 }}
                  interval={5}
                  tickFormatter={(v) => `${String(v).padStart(2, "0")} oct`}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#90968b", fontSize: 11 }}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v: number) => money(v)}
                  labelFormatter={(v) => `${v} de octubre`}
                  contentStyle={{
                    borderRadius: 10,
                    borderColor: "#e3e8dd",
                    fontSize: 12,
                  }}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="previous"
                  name="Mes anterior"
                  stroke="#c4cbbd"
                  strokeDasharray="5 5"
                  fill="transparent"
                  strokeWidth={1.6}
                />
                <Area
                  isAnimationActive={false}
                  type="monotone"
                  dataKey="actual"
                  name="Este mes"
                  stroke="#648552"
                  fill="url(#revenue)"
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel top-products">
          <div className="panel-heading">
            <div>
              <h3>Productos más vendidos</h3>
              <p>Los favoritos de tus clientes</p>
            </div>
            <span className="subtle-icon">
              <TrendingUp size={18} />
            </span>
          </div>
          {(data?.top_products || []).map(({ product: p, quantity, total }) => (
            <div className="top-product" key={p.id}>
              <span className="product-visual" style={{ background: p.color }}>
                <ProductImage product={p} />
              </span>
              <div className="flex-1 min-w-0">
                <strong>{p.name}</strong>
                <span>{quantity} unidades vendidas</span>
              </div>
              <b>{money(total)}</b>
            </div>
          ))}
          <Link className="panel-link" to="/reports">
            Ver reporte de productos <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <div className="bottom-grid">
        <section className="panel recent-sales">
          <div className="panel-heading">
            <div>
              <h3>
                Ventas recientes{" "}
                <span className="count-pill">{sales?.data.length || 0}</span>
              </h3>
              <p>Las últimas transacciones de tu negocio</p>
            </div>
            <Link to="/sales" className="text-link">
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>
          <DataTable<Sale>
            data={sales?.data.slice(0, 5) || []}
            columns={[
              {
                header: "Venta",
                accessorKey: "number",
                cell: (c) => (
                  <Link className="sale-id" to="/sales">
                    #{c.getValue()}
                  </Link>
                ),
              },
              {
                header: "Cliente",
                accessorKey: "customer",
                cell: (c) => (
                  <span className="customer-cell">
                    <span className="tiny-avatar">
                      {c.getValue() === "Público general" ? (
                        <Users size={12} />
                      ) : (
                        c
                          .getValue()
                          .split(" ")
                          .map((n: string) => n[0])
                          .slice(0, 2)
                          .join("")
                      )}
                    </span>
                    {c.getValue()}
                  </span>
                ),
              },
              {
                header: "Hora",
                accessorKey: "created_at",
                cell: (c) => (
                  <span className="muted">
                    {format(new Date(c.getValue()), "HH:mm")}
                  </span>
                ),
              },
              {
                header: "Total",
                accessorKey: "total",
                cell: (c) => <strong>{money(c.getValue())}</strong>,
              },
              {
                header: "Estado",
                accessorKey: "status",
                cell: (c) => (
                  <span
                    className={`badge ${c.getValue() === "Cancelada" ? "badge-neutral" : "badge-green"}`}
                  >
                    <i />
                    {c.getValue()}
                  </span>
                ),
              },
            ]}
          />
        </section>
        <section className="panel stock-panel">
          <div className="panel-heading">
            <div>
              <h3>
                <span className="alert-symbol">
                  <AlertTriangle size={16} />
                </span>
                Stock bajo{" "}
                <span className="count-pill amber">{low.length}</span>
              </h3>
              <p>Es momento de reabastecer</p>
            </div>
          </div>
          {low.slice(0, 3).map((p) => (
            <div className="low-product" key={p.id}>
              <span
                className="product-visual small-visual"
                style={{ background: p.color }}
              >
                <ProductImage product={p} />
              </span>
              <div>
                <strong>{p.name}</strong>
                <span>SKU: {p.sku}</span>
              </div>
              <span className="stock-badge">
                {p.stock} {p.unit}
              </span>
            </div>
          ))}
          <Link className="panel-link" to="/products?stock=low">
            Revisar inventario <ArrowRight size={14} />
          </Link>
        </section>
      </div>
      <section className="quick-actions">
        <span>ACCESOS RÁPIDOS</span>
        <Link to="/pos">
          <ScanLine size={18} />
          Abrir punto de venta
          <ArrowUpRight size={14} />
        </Link>
        <Link to="/products?new=1">
          <Package size={18} />
          Agregar producto
          <ArrowUpRight size={14} />
        </Link>
        <Link to="/customers?new=1">
          <Users size={18} />
          Nuevo cliente
          <ArrowUpRight size={14} />
        </Link>
        <Link to="/purchases">
          <Truck size={18} />
          Registrar compra
          <ArrowUpRight size={14} />
        </Link>
      </section>
    </>
  );
}
