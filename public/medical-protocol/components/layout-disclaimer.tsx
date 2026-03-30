"use client";

import { useState } from "react";
import { TriangleAlert, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/**
 * LayoutDisclaimer — Prominent medical disclaimer banner for app layout
 *
 * Place in app/layout.tsx above {children} so it appears on every page.
 * Collapsible: shows a one-line summary by default, expands to full text.
 *
 * @example
 * // app/layout.tsx
 * import { LayoutDisclaimer } from "@/components/layout-disclaimer"
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <LayoutDisclaimer />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 */
export function LayoutDisclaimer() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="mx-auto max-w-7xl px-4 py-2">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2 text-sm text-amber-800 dark:text-amber-200"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span className="font-medium">
                Clinical Support Tool — Not a Medical Device
              </span>
              <span className="ml-auto text-xs text-amber-600 dark:text-amber-400">
                {isOpen ? "Hide" : "Learn more"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-amber-600 transition-transform dark:text-amber-400 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-2 space-y-2 border-t border-amber-200/60 pt-2 text-sm text-amber-900 dark:border-amber-800/60 dark:text-amber-100">
              <p>
                This tool is designed to assist healthcare professionals and has
                not been certified or cleared as a medical device by the FDA,
                EMA, or any regulatory body. It is not intended for clinical
                diagnosis or as a substitute for professional medical judgment.
              </p>
              <ul className="list-inside list-disc space-y-1 text-amber-800 dark:text-amber-200">
                <li>
                  <strong>AI-assisted:</strong> Interface components and analysis
                  features may be generated or powered by artificial
                  intelligence. Always verify AI outputs independently.
                </li>
                <li>
                  <strong>Data privacy:</strong> All patient data is processed
                  and stored locally on your device. No clinical data is
                  transmitted to external servers.
                </li>
                <li>
                  <strong>Clinical responsibility:</strong> Verify all values,
                  calculations, and recommendations before making treatment
                  decisions.
                </li>
              </ul>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}
