/**
 * @deprecated Use safeParseFloatOrNull from lib/utils/safeParseFloat instead.
 * Kept for backward compatibility — delegates to the canonical implementation.
 */
import { safeParseFloatOrNull } from "../utils/safeParseFloat";

export const safeFloat = (val: string): number | null => safeParseFloatOrNull(val);
