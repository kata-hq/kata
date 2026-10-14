// Fixture: tests may query without the scope (fake clients). Not reported.
export const rows = (db: any) => db.course.findMany();
