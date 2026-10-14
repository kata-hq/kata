// Allowed in a pure package: own files, @kata/shared, dates built from inputs. Date.now() in a comment is ignored.
import { ok } from "@kata/shared";
import { helper } from "./clock.ts";

export const parse = (reference: string) => ok({ at: new Date(reference), helper });
