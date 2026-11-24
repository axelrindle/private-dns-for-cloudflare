import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wails from "@wailsio/runtime/plugins/vite";
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { readFileSync } from 'node:fs'

// build/config.yml is the single source of truth for the app version.
const buildConfig = readFileSync(new URL('../build/config.yml', import.meta.url), 'utf8')
const appVersion = buildConfig.match(/^\s+version:\s*"([^"]+)"/m)?.[1] ?? 'unknown'

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
        devtools(),
        tailwindcss(),
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        wails("./src/gen/bindings")
    ],
    server: {
        host: "127.0.0.1",
        port: Number(process.env.WAILS_VITE_PORT) || 9245,
        strictPort: true,
    },
});
