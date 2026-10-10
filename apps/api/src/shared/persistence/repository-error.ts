/**
 * Expected persistence failures. Repositories return them as `Err`; anything else (lost connection,
 * bad SQL) is a bug or an outage and is thrown.
 * `constraint` names the violated constraint (or its fields) when the database reports it.
 */
export type RepositoryError =
  | { readonly type: "unique-violation"; readonly constraint: string | undefined }
  | { readonly type: "not-found" }
  | { readonly type: "foreign-key-violation"; readonly constraint: string | undefined };
