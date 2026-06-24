/**
 * Escape PostgREST special characters in a user-provided value
 * so it can be safely interpolated into PostgREST filter strings.
 *
 * PostgREST treats `%`, `,`, `.`, `(`, `)` as operators.
 * Escaping them prevents filter injection or unintended behavior.
 */
export function escapePostgrest(value: string): string {
  return value
    .replace(/%/g, "\\%")
    .replace(/,/g, "\\,")
    .replace(/\./g, "\\.")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}
