import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { host: "0.0.0.0", allowedHosts: true },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/recharts|d3-|victory|react-smooth/.test(id)) return "charts";
            if (/framer-motion|motion-dom|motion-utils/.test(id))
              return "motion";
            if (/@tanstack/.test(id)) return "data";
            if (/react-hook-form|zod|@hookform/.test(id)) return "forms";
            return "vendor";
          }
        },
      },
    },
  },
});
