import { ErrorBoundary } from "./components/shared/ErrorBoundary";
import React, { useEffect, lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "./stores/auth.store";
import { Shell } from "./components/layout/Shell";
import { Dashboard } from "./features/Dashboard";
import { AuthPage } from "./features/Auth";
const CatalogSettings = lazy(() =>
  import("./features/CatalogSettings").then((m) => ({
    default: m.CatalogSettings,
  })),
);
const Products = lazy(() =>
  import("./features/Products").then((m) => ({ default: m.Products })),
);
const POS = lazy(() =>
  import("./features/POS").then((m) => ({ default: m.POS })),
);
import {
  Contacts,
  Sales,
  Cash,
  Profile,
  Subscription,
  Purchases,
  Help,
} from "./features/Management";
const Reports = lazy(() =>
  import("./features/Reports").then((m) => ({ default: m.Reports })),
);
const AdminPanel = lazy(() =>
  import("./features/AdminPanel").then((m) => ({ default: m.AdminPanel })),
);
import type { Role } from "./types";
import "./styles.css";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});
function Protected({ roles }: { roles?: Role[] }) {
  const auth = useAuth();
  if (!auth.user) return <Navigate to="/auth/login" replace />;
  if (roles && !roles.includes(auth.user.role))
    return <Navigate to="/" replace />;
  return <Outlet />;
}
function Animated({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}
function Shortcuts() {
  const navigate = useNavigate();
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        navigate("/pos");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document
          .querySelector<HTMLInputElement>(".global-search input")
          ?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);
  return null;
}
function App() {
  return (
    <BrowserRouter>
      <Shortcuts />
      <Suspense fallback={<div className="empty">Cargando módulo…</div>}>
        <Routes>
          {["login", "register", "forgot-password", "reset-password"].map(
            (action) => (
              <Route
                key={action}
                path={"/auth/" + action}
                element={<AuthPage key={action} />}
              />
            ),
          )}
          <Route element={<Protected />}>
            <Route element={<Shell />}>
              <Route
                index
                element={
                  <Animated>
                    <Dashboard />
                  </Animated>
                }
              />
              <Route path="pos" element={<POS />} />
              <Route path="sales" element={<Sales />} />
              <Route
                path="customers"
                element={<Contacts key="customers" kind="customers" />}
              />
              <Route path="cash" element={<Cash />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="auth/profile"
                element={<Navigate to="/profile" replace />}
              />
              <Route
                path="auth/me"
                element={<Navigate to="/profile" replace />}
              />
              <Route path="help" element={<Help />} />
              <Route element={<Protected roles={["admin", "business"]} />}>
                <Route path="products" element={<Products />} />
                <Route path="catalog" element={<CatalogSettings />} />
                <Route
                  path="suppliers"
                  element={<Contacts key="suppliers" kind="suppliers" />}
                />
                <Route path="purchases" element={<Purchases />} />
                <Route path="reports" element={<Reports />} />
                <Route path="subscription" element={<Subscription />} />
              </Route>
              <Route element={<Protected roles={["admin"]} />}>
                <Route path="admin" element={<AdminPanel />} />
              </Route>
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Página no encontrada</h1>
                    <a href="/">Volver al resumen</a>
                  </div>
                }
              />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" closeButton />
    </BrowserRouter>
  );
}
// First visit opens a clearly labelled sandbox. Signing out never silently re-authenticates.
if (!localStorage.getItem("ultrapos-auth")) useAuth.getState().startDemo();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={client}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
