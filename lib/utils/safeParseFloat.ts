/**
 * Safely parse a value to a float, returning 0 for empty/null/undefined/NaN.
 * Shared across all lib/ calculation modules.
 */
export const safeParseFloat = (value: string | number | null | undefined): number => {
  if (value === "" || value === null || value === undefined) return 0;
  const parsed = parseFloat(String(value));
  return isNaN(parsed) ? 0 : parsed;
};
