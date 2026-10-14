// Rule C3: the task type comes from the aliases of the TaskType data (K-R5), never from code.
import { findPhrase, type Phrase, type PhraseMatch, wordsOf } from "./phrases.ts";
import type { TaskTypeCandidate } from "./types.ts";

/** The first task type alias among the free words (`null` = used), the longest alias at that word. */
export function findTaskType(
  words: readonly (string | null)[],
  taskTypes: readonly TaskTypeCandidate[],
): PhraseMatch<TaskTypeCandidate> | null {
  const phrases: Phrase<TaskTypeCandidate>[] = taskTypes.flatMap((type) =>
    type.aliases.map((alias) => ({ words: wordsOf(alias), value: type })),
  );
  return findPhrase(words, phrases, { plural: true });
}
