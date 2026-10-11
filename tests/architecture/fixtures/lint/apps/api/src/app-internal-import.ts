// Breaks: module-public-api.grit (app-level code must also go through the module's index.ts)
import { SystemCheckHealthService } from "./modules/health/application/health-service.ts";

export const Service = SystemCheckHealthService;
