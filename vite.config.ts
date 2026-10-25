// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Set by the "build:mobile" script only — keeps the normal web/Lovable build
// (cloudflare worker output) completely untouched.
const isMobileBuild = process.env["CAPACITOR_BUILD"] === "true";

export default defineConfig({
  vite: {
    server: {
      allowedHosts: true,
    },
    preview: { host: "127.0.0.1" },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // SPA mode: prerenders a static shell + hydrates fully client-side, no server/worker
    // needed at runtime. Only used for the offline Capacitor/Android build.
    ...(isMobileBuild ? { spa: { enabled: true } } : {}),
  },
  // Disable nitro for the offline/Capacitor build only: the SPA prerender step expects
  // TanStack Start's own default dist/ server layout, not nitro's .output/ layout.
  // The normal build keeps nitro's default (cloudflare) behavior for Lovable/web hosting.
  ...(isMobileBuild ? { nitro: false } : {}),
});
