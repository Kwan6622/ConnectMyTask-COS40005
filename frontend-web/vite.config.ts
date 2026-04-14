import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Accept both VITE_* and NEXT_PUBLIC_* so this project can reuse
  // the env naming requested in the capstone instructions.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
})
