import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serverer prosjektsider fra /<repo>/, så base må matche
// repo-navnet. Lokalt kjører vi fra roten.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kampe-hub/' : '/',
  plugins: [react()],
}))
