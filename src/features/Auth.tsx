import { authResponseSchema } from "../api/schemas";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { request } from "../api/client";
import { useAuth } from "../stores/auth.store";
import { Button } from "../components/ui/button";
import type { User, Role } from "../types";
export function AuthPage() {
  const path = useLocation().pathname;
  const registerPage = path.includes("register");
  const forgot = path.includes("forgot");
  const reset = path.includes("reset");
  const navigate = useNavigate();
  const auth = useAuth();
  const [busy, setBusy] = useState(false);
  const [demoRole, setDemoRole] = useState<Role>("business");
  const schema = z.object({
    email: z.string().email("Ingresa un correo válido"),
    password: forgot
      ? z.string().optional()
      : z.string().min(8, "Utiliza al menos 8 caracteres"),
    name: registerPage
      ? z.string().min(2, "Escribe tu nombre")
      : z.string().optional(),
    business_name: registerPage
      ? z.string().min(2, "Escribe el nombre de tu negocio")
      : z.string().optional(),
    business_type: z.string().optional(),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const title = registerPage
    ? "Tu negocio empieza aquí"
    : forgot
      ? "Recupera tu acceso"
      : reset
        ? "Nueva contraseña"
        : "Bienvenido de nuevo";
  async function submit(values: z.infer<typeof schema>) {
    setBusy(true);
    try {
      const result = await request<{ user: User; token: string }>(
        "POST",
        path,
        { ...values, token: new URLSearchParams(location.search).get("token") },
      );
      if (forgot || reset) {
        toast.success("Solicitud enviada. Revisa tu correo o inicia sesión.");
        navigate("/auth/login");
      } else if (result.data?.token) {
        const parsed = authResponseSchema.safeParse(result.data);
        if (!parsed.success) {
          toast.error(
            "La sesión recibida no contiene un usuario y token válidos.",
          );
          return;
        }
        auth.login(parsed.data.user, parsed.data.token);
        navigate(
          parsed.data.user.role === "admin"
            ? "/admin"
            : parsed.data.user.role === "seller"
              ? "/pos"
              : "/",
        );
      } else {
        toast.success("Cuenta creada. Inicia sesión para continuar.");
        navigate("/auth/login");
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Link className="brand text-white" to="/">
          {" "}
          <span className="brand-symbol">u·</span>ultrapos
        </Link>
        <div>
          <div className="eyebrow">
            MENOS COMPLICACIONES. MÁS POSIBILIDADES.
          </div>
          <h1>
            Tu negocio,
            <br />
            en buenas manos.
          </h1>
          <p>
            Vende, organiza y crece con todas las herramientas que necesitas en
            un solo lugar.
          </p>
          <div className="auth-illustration">
            ↗<span>Todo bajo control.</span>
          </div>
        </div>
        <span className="flex items-center gap-2 text-sm">
          <ShieldCheck size={18} />
          Un espacio seguro para tu negocio
        </span>
      </div>
      <div className="auth-form-wrap">
        <form className="auth-form" onSubmit={handleSubmit(submit)}>
          <span className="section-label">BIENVENIDO A ULTRAPOS</span>
          <h1>{title}</h1>
          <p>
            {registerPage
              ? "Crea tu cuenta y comienza a vender."
              : "Ingresa tus datos para continuar."}
          </p>
          {registerPage && (
            <>
              <label>
                Tu nombre
                <input {...register("name")} placeholder="Alejandro Martínez" />
              </label>
              <label>
                Nombre del negocio
                <input
                  {...register("business_name")}
                  placeholder="La Esquina Market"
                />
              </label>
              <label>
                Tipo de negocio
                <select {...register("business_type")}>
                  <option value="tienda">Tienda / Retail</option>
                  <option value="farmacia">Farmacia</option>
                  <option value="restaurante">Restaurante</option>
                  <option value="otro">Otro</option>
                </select>
              </label>
            </>
          )}
          <label>
            Correo electrónico
            <input
              {...register("email")}
              type="email"
              placeholder="nombre@negocio.com"
            />
          </label>
          {!forgot && (
            <label>
              Contraseña
              <input
                {...register("password")}
                type="password"
                placeholder="Mínimo 8 caracteres"
              />
            </label>
          )}
          {Object.values(errors).map((e, i) => (
            <p className="field-error" key={i}>
              {e.message}
            </p>
          ))}
          {!registerPage && !forgot && !reset && (
            <Link className="text-link justify-end" to="/auth/forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          )}
          <Button className="w-full mt-6" disabled={busy}>
            {busy
              ? "Procesando…"
              : registerPage
                ? "Crear mi negocio"
                : forgot
                  ? "Enviar enlace"
                  : reset
                    ? "Actualizar contraseña"
                    : "Iniciar sesión"}
            <ArrowRight size={17} />
          </Button>
          <div className="auth-separator">o explora UltraPOS</div>
          <label>
            Rol de demostración
            <select
              value={demoRole}
              onChange={(e) => setDemoRole(e.target.value as Role)}
            >
              <option value="business">Dueño de negocio</option>
              <option value="seller">Vendedor</option>
              <option value="admin">Administrador global</option>
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              auth.startDemo();
              useAuth.setState((s) => ({
                user: s.user ? { ...s.user, role: demoRole } : null,
              }));
              navigate(demoRole === "admin" ? "/admin" : "/");
            }}
          >
            Entrar a la demostración
          </Button>
          <p className="text-center mt-6 text-sm">
            {registerPage || forgot || reset ? (
              <Link to="/auth/login">Volver a iniciar sesión</Link>
            ) : (
              <>
                ¿Aún no tienes cuenta?{" "}
                <Link
                  className="text-green-800 font-semibold"
                  to="/auth/register"
                >
                  Regístrate
                </Link>
              </>
            )}
          </p>
        </form>
        <small className="muted">
          © 2026 UltraPOS · Hecho para hacer crecer tu negocio.
        </small>
      </div>
    </div>
  );
}
