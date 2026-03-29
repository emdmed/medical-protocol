import { TriangleAlert } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 pt-2 select-none">
      <TriangleAlert className="h-3 w-3 shrink-0" />
      <span>
        For clinical support only — does not replace professional medical
        judgment. Verify all values before making treatment decisions.
      </span>
    </p>
  );
}
