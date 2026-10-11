// Breaks: module-public-api.grit (relative path and modules/ path into another module's internals)
import { CourseService } from "../../academic/application/course-service.ts";
import type { Course } from "../../../modules/academic/domain/course.ts";

export type Deps = { courses: CourseService; course: Course };
