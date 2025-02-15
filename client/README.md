# React + TypeScript + Vite + Dojo

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## To run the project follow this steps:

1. Run Katana
```bash
katana --dev --dev.no-fee --http.cors_origins '*'
```

2. Build Contracts
```bash
sozo build
```

3. Migrate Contracts
```bash
sozo migrate
```

4. Run Torii
```bash
torii -w {world_address-output of previous command} --http.cors_origins '*'
```

5. Run App
```bash
pnpm run dev
```