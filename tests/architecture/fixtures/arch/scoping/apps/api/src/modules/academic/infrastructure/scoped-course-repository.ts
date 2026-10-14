// Fixture: scoped queries, creates and a non-content model. Nothing here may be reported.
import { scoped, workspaceScope } from "../../../shared/persistence/workspace-scope.ts";

export class ScopedCourseRepository {
  constructor(private readonly db: any) {}

  findAll(workspaceId: string) {
    return this.db.course.findMany({ where: scoped(workspaceId, { name: { contains: "a" } }) });
  }

  count(workspaceId: string) {
    return this.db.course.count({ where: { ...workspaceScope(workspaceId) } });
  }

  create(workspaceId: string, name: string) {
    return this.db.course.create({ data: { workspaceId, name } });
  }

  holidays() {
    return this.db.holiday.findMany();
  }
}
