// Fixture: queries on the content model `course` without the workspace scope. Each must be reported.
export class UnscopedCourseRepository {
  constructor(private readonly db: any) {}

  findAll(workspaceId: string) {
    return this.db.course.findMany({ where: { workspaceId } });
  }

  rename(id: string, name: string) {
    return this.db.course.update({
      where: { id },
      data: { name },
    });
  }
}
