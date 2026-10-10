import { useState, useEffect } from "react";
import { useDemo } from "../../stores/demo.store";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBasket,
  Package,
  ShoppingBag,
  Users,
  Truck,
  ChartNoAxesCombined,
  Wallet,
  CreditCard,
  Settings,
  ChevronsUpDown,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Store,
  Check,
} from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../stores/auth.store";
import { useCart } from "../../stores/cart.store";
import { useResource } from "../../api/hooks";
import { request } from "../../api/client";
import type { Notification, User } from "../../types";
const nav = [
  { label: "Resumen", path: "/", icon: LayoutDashboard },
  { label: "Punto de venta", path: "/pos", icon: ShoppingBasket },
  { label: "Productos", path: "/products", icon: Package },
  { label: "Ventas", path: "/sales", icon: ShoppingBag },
  { label: "Clientes", path: "/customers", icon: Users },
  { label: "Proveedores", path: "/suppliers", icon: Truck },
  { label: "Compras", path: "/purchases", icon: ShoppingBag },
  { label: "Caja", path: "/cash", icon: Wallet },
  { label: "Reportes", path: "/reports", icon: ChartNoAxesCombined },
];
export function Shell() {
  const auth = useAuth();
  const initials = (auth.user?.name || "Usuario")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
  const location = useLocation();
  const productCount = useDemo((s) => s.products.length);
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [profile, setProfile] = useState(false);
  const [read, setRead] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const me = useQuery({
    queryKey: ["auth-me", auth.businessId],
    queryFn: async () => (await request<User>("GET", "/auth/me")).data,
    enabled: !auth.demo && !!auth.token,
    staleTime: 60000,
  });
  useEffect(() => {
    if (me.data && !auth.demo) useAuth.setState({ user: me.data });
  }, [me.data, auth.demo]);
  const initial: Notification[] = [
    { id: 1, title: "4 productos necesitan reabastecimiento", read: false },
    { id: 2, title: "Tu resumen de ventas está listo", read: false },
  ];
  const { data } = useResource("/notifications", initial);
  const notes = (data?.data || []).map((n) => ({
    ...n,
    read: n.read || read.includes(n.id),
  }));
  const mark = useMutation({
    mutationFn: async (id: number) =>
      auth.demo ? null : request("PATCH", `/notifications/${id}/read`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["/notifications"] });
      setRead((s) => [...s, id]);
      return id;
    },
    onError: (_, id) => setRead((s) => s.filter((n) => n !== id)),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ["/notifications"] }),
  });
  function logout() {
    auth.logout();
    useCart.getState().clear();
    queryClient.clear();
    navigate("/auth/login");
  }
  return (
    <div className="app-shell">
      {mobile && (
        <div className="sidebar-backdrop" onClick={() => setMobile(false)} />
      )}
      <aside className={`sidebar ${mobile ? "is-open" : ""}`}>
        <NavLink to="/" className="brand">
          <span className="brand-symbol">
            u<span>·</span>
          </span>
          <span>
            ultra<span className="font-normal">pos</span>
            <small>WORKSPACE</small>
          </span>
        </NavLink>
        <button
          aria-label="Cerrar menú"
          className="mobile-close icon-btn"
          onClick={() => setMobile(false)}
        >
          <X />
        </button>
        <div className="business-switch">
          <span className="store-icon">
            <Store size={19} />
          </span>
          <div>
            <strong>
              {auth.user?.businesses?.find((b) => b.id === auth.businessId)
                ?.name || "Mi negocio"}
            </strong>
            <small>Tu espacio de trabajo</small>
          </div>
          <ChevronsUpDown size={14} />
          <select
            aria-label="Negocio activo"
            value={auth.businessId}
            onChange={(e) => {
              auth.setBusiness(+e.target.value);
              useCart.getState().clear();
              queryClient.clear();
            }}
          >
            {auth.user?.businesses?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <div className="nav-caption">PRINCIPAL</div>
        <nav>
          {nav
            .filter(
              (n) =>
                auth.user?.role !== "seller" ||
                ["/", "/pos", "/sales", "/customers", "/cash"].includes(n.path),
            )
            .map(({ label, path, icon: Icon }) => (
              <NavLink
                end={path === "/"}
                to={path}
                key={path}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <Icon size={19} strokeWidth={1.7} />
                <span>{label}</span>
                {path === "/pos" && <kbd>F2</kbd>}
                {path === "/products" && (
                  <span className="nav-count">
                    {auth.demo ? productCount : null}
                  </span>
                )}
              </NavLink>
            ))}
        </nav>
        <div className="nav-caption mt-7">ADMINISTRACIÓN</div>
        {auth.user?.role !== "seller" && (
          <NavLink className="nav-item" to="/subscription">
            <CreditCard size={19} />
            Mi suscripción
          </NavLink>
        )}
        <NavLink className="nav-item" to="/profile">
          <Settings size={19} />
          Configuración
        </NavLink>
        {auth.user?.role === "admin" && (
          <NavLink className="nav-item" to="/admin">
            <ShieldCheck size={19} />
            Admin global
          </NavLink>
        )}
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div className="flex justify-between">
              <span className="plan-tag">PLAN PRO</span>
              <span className="little-spark">✧</span>
            </div>
            <strong>Un impulso para tu negocio</strong>
            <p>Más herramientas. Más posibilidades.</p>
            <NavLink to="/subscription">
              Conoce tu plan <ArrowUpRight size={14} />
            </NavLink>
          </div>
          <button className="help-link" onClick={() => navigate("/help")}>
            <HelpCircle size={18} />
            Centro de ayuda
            <ArrowUpRight size={14} />
          </button>
          <div className="side-user">
            <span className="avatar">{initials}</span>
            <div>
              <strong>{auth.user?.name || "Alejandro Martínez"}</strong>
              <small>
                {auth.user?.role === "admin"
                  ? "Administrador global"
                  : "Administrador"}
              </small>
            </div>
            <button title="Cerrar sesión" className="icon-btn" onClick={logout}>
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              aria-label="Abrir menú"
              className="mobile-menu icon-btn"
              onClick={() => setMobile(true)}
            >
              <Menu />
            </button>
            <span className="breadcrumb">
              Mi negocio <span>/</span>{" "}
              <strong>
                {nav.find((n) => n.path === location.pathname)?.label ||
                  "Administración"}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/products?q=" + encodeURIComponent(search));
              }}
            >
              <Search size={16} />
              <input
                aria-label="Buscar en el negocio"
                placeholder="Buscar en tu negocio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌘ K</kbd>
            </form>
            <span className="connection">
              <i />
              {auth.demo ? "Demo" : "Sesión activa"}
            </span>
            <div className="relative">
              <button
                aria-label="Notificaciones"
                className="notification-btn"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={20} />
                {notes.some((n) => !n.read) && <i />}
              </button>
              {notifications && (
                <div className="popover">
                  <h3>Notificaciones</h3>
                  {notes.map((n) => (
                    <button
                      key={n.id}
                      className="notification-row"
                      onClick={() => mark.mutate(n.id)}
                    >
                      <span
                        className={n.read ? "text-gray-400" : "text-green-700"}
                      >
                        <Check size={16} />
                      </span>
                      {n.title}
                      {!n.read && <i />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="header-divider" />
            <div className="relative">
              <button
                className="flex items-center gap-2"
                onClick={() => setProfile(!profile)}
                aria-label="Menú de perfil"
              >
                <span className="avatar small">{initials}</span>
                <ChevronDown size={14} />
              </button>
              {profile && (
                <div className="popover w-48">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setProfile(false);
                    }}
                  >
                    Mi perfil
                  </button>
                  <button onClick={logout}>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
        <footer>
          <span>
            © 2026 UltraPOS <span className="mx-2">·</span> Tu negocio, en
            control.
          </span>
          <span className="flex items-center gap-2">
            <i className="status-dot" />
            {auth.demo
              ? "Modo demostración · Datos de ejemplo"
              : "Sesión activa"}
          </span>
        </footer>
      </div>
    </div>
  );
}
