import { index, type RouteConfig, route } from "@react-router/dev/routes";

// `/dev/preview` exists only in dev: the production build has no such route and no code for it.
const devRoutes = import.meta.env.DEV ? [route("dev/preview", "routes/dev-preview.tsx")] : [];

export default [index("routes/home.tsx"), ...devRoutes] satisfies RouteConfig;
