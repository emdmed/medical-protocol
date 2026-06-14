# Component Composition Patterns

How to wire medical protocol components together. For individual component props and types, read the JSDoc header in each component's main TSX file after installing via `npx medical-ui-cli add <name>`.

---

## Dashboard: Multiple calculators in a grid

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import AcidBase from "@/components/acid-base/acid-base";
import WaterBalanceCalculator from "@/components/water-balance/water-balance";
import BMICalculator from "@/components/bmi/bmi-calculator";
import { IVitalSignsData } from "@/components/vital-signs/types/vital-signs";
import { Result } from "@/components/acid-base/types/interfaces";

function Dashboard() {
  const [vitals, setVitals] = useState<IVitalSignsData | null>(null);
  const [abgResult, setAbgResult] = useState<Result | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <VitalSigns onData={(data) => setVitals(data)} editable />
      <AcidBase onData={(result) => setAbgResult(result)} />
      <WaterBalanceCalculator data={{ weight: 70 }} />
      <BMICalculator />
    </div>
  );
}
```

## Read-only vitals (no editing, no border)

```tsx
<VitalSigns
  data={{
    bloodPressure: { systolic: 120, diastolic: 80 },
    heartRate: 72,
    respiratoryRate: 16,
    temperature: 98.6,
    bloodOxygen: { saturation: 98, fiO2: 21 },
  }}
  editable={false}
  assistant={false}
  border={false}
/>
```

## Collecting data from multiple components into one submission

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import AcidBase from "@/components/acid-base/acid-base";
import { IVitalSignsData, FhirBundle } from "@/components/vital-signs/types/vital-signs";
import { Result } from "@/components/acid-base/types/interfaces";

interface PatientAssessment {
  vitals: IVitalSignsData | null;
  fhir: FhirBundle | null;
  abg: Result | null;
}

function AssessmentForm({ onSubmit }: { onSubmit: (data: PatientAssessment) => void }) {
  const [assessment, setAssessment] = useState<PatientAssessment>({
    vitals: null, fhir: null, abg: null,
  });

  return (
    <div className="space-y-4">
      <VitalSigns
        onData={(data, fhir) =>
          setAssessment((prev) => ({ ...prev, vitals: data, fhir: fhir ?? null }))
        }
      />
      <AcidBase
        onData={(result) =>
          setAssessment((prev) => ({ ...prev, abg: result }))
        }
      />
      <button onClick={() => onSubmit(assessment)}>Submit</button>
    </div>
  );
}
```

---

## Dashboard with PaFi and DKA monitoring

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import AcidBase from "@/components/acid-base/acid-base";
import PaFiCalculator from "@/components/pafi/pafi-calculator";
import DKAMonitor from "@/components/dka/dka-monitor";
import type { DKAPatientData } from "@/components/dka/types/dka";

function ICUDashboard() {
  const [dkaData, setDkaData] = useState<DKAPatientData | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <VitalSigns onData={(data) => {}} editable />
      <AcidBase onData={(result) => {}} />
      <PaFiCalculator />
      <DKAMonitor data={dkaData ?? undefined} onData={setDkaData} />
    </div>
  );
}
```

## Patient data wiring

When `patient` and dependent components share a dashboard, use Patient as the single source of truth for demographics. Pass its fields down to dependents instead of letting each component collect age/sex/weight inline.

```tsx
import Patient from "@/components/patient/patient";
import CKDCalculator from "@/components/ckd/ckd-calculator";
import DKAMonitor from "@/components/dka/dka-monitor";
import BMICalculator from "@/components/bmi/bmi-calculator";
import type { PatientData } from "@/components/patient/types/patient";

function Dashboard() {
  const [patient, setPatient] = useState<PatientData | null>(null);

  return (
    <div className="space-y-6">
      {/* Patient card: full-width, above the grid */}
      <Patient onData={(data) => setPatient(data)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CKDCalculator
          data={{
            age: patient?.age,
            sex: patient?.sex,
          }}
        />
        <DKAMonitor
          data={{
            weight: patient?.weight,
          }}
        />
        <BMICalculator
          data={{
            weight: patient?.weight,
            height: patient?.height,
          }}
        />
      </div>
    </div>
  );
}
```

**Which fields each component consumes from Patient:**

| Component | Fields |
|---|---|
| ckd / nephrology | age, sex |
| dka | weight |
| sepsis | weight |
| water-balance | weight |
| cardiology | age, sex |
| bmi | weight, height |

---

## Overlay tagging contract (`data-medprotocol-*`) — optional fast-path

> **The overlay does not require these tags.** Its job is to retrofit medical protocol into apps
> built *without* it, so by default it selects **any** DOM element and captures a CSS selector +
> `outerHTML` for the agent to classify (see `context/overlay.md`). These attributes are an
> **optional fast-path**: when an app *is* already medprotocol-based, they let Audit/Implement skip
> classification and resolve straight to the registry id + source. Emit them when you can; nothing
> breaks when they're absent.

The dev overlay (served by `npx medprotocol overlay --serve`) lets a doctor hover a rendered element, select it, and queue an **Audit** or **Implement** work order. When present, these attributes are read off the selected node (or its nearest tagged ancestor):

```html
<div
  data-medprotocol-id="bmi"                  <!-- optional: registry id (see components.md) -->
  data-medprotocol-source="bmi/bmi-card.tsx" <!-- optional: source path for Audit/Implement -->
  data-medprotocol-instance="bmi-1"          <!-- optional: disambiguate multiple instances -->
>
```

| Attribute | Meaning |
|---|---|
| `data-medprotocol-id` | One of the registry ids in `components.md` (`patient`, `vital-signs`, `acid-base`, `bmi`, `pafi`, `dka`, `cardiology`, `ckd`, `nephrology`, `sepsis`, `diabetes-dx`, `dashboard`, …). Lets the skills skip classification and resolve straight to the module. Surfaces in the work order as `suggestedId`. |
| `data-medprotocol-source` | Relative source path (under `components/`) so Audit/Implement can open the exact file without searching. Surfaces as `source`. |
| `data-medprotocol-instance` | Stable id to disambiguate multiple instances of the same component on one page. |

**Rules:**
- All three are **optional**. Without them the overlay still selects the element and captures a CSS selector + `outerHTML`; the skills classify from that. With them, the skills take the fast-path.
- When present, put `data-medprotocol-id` on the **outermost** rendered element so the overlay's nearest-ancestor lookup resolves to the whole component.
- `data-medprotocol-id`, if set, should match a registry id exactly — the core↔UI drift-check (`scripts/drift-check.js`) treats an unknown id as a contract violation.
- Attributes are inert in production; the overlay only mounts in dev. They add no runtime behavior, just a selection fast-path.

Every selection (tagged or not) writes a work order to `.medprotocol/queue/` — see `context/overlay.md` for the queue schema and the Audit/Implement semantics.

---

## Gotchas

- **Group installs**: For nephrology dashboards, use `npx medical-ui-cli add nephrology` (group) to install both `ckd/` and `nephrology/` folders at once. Sub-component aliases (`anemia`, `phospho-calcic`, `cardio-metabolic`) install just the `nephrology/` folder.

- **overflow-hidden clipping**: shadcn `Card` uses `overflow-hidden` by default. Add `overflow-visible` to any Card wrapping VitalSigns — its edit popups use absolute positioning. AcidBase result badges now render inline below inputs (no overflow fix needed).

- **Result overlap prevention**: Calculator result badges/output must always render **below** the input fields using inline flow — never above them using `absolute bottom-*`. Absolute positioning above inputs causes results to overlap the component title.

- **VitalSigns circular updates**: If your parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. The hook uses ref-based dedup internally, but external effect chains can still infinite-loop.

- **AcidBase fires onData(null) on mount**: Guard against null in your handler — it fires immediately before any user input.

- **Temperature units**: VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.

- **FHIR bundle**: The second argument to VitalSigns' `onData` is a FHIR R4 Bundle with LOINC codes. Always available (VitalSignsFhir renders internally).

- **Patient data cascading**: When patient data changes, dependent components auto-update via props. Use the ref-based dedup pattern (see VitalSigns circular updates above) to prevent re-render cascades in components that both receive `data` and emit `onData`.

- **Inbound data sync required**: Components that accept a `data` prop must have a `useEffect` that syncs prop changes into local state — not just read the prop on initial mount. Without this, parent updates (e.g. age/sex changed in the Patient card) never reach the child. Pattern: compare `JSON.stringify(data)` against a `prevDataRef` and call `setState` only when changed.

- **Multi-patient dashboards — use `key={activeId}`**: When a dashboard supports switching between patients, add `key={activeId}` to every component (and its ErrorBoundary). This forces a clean remount on patient switch, preventing stale state from one patient bleeding into another.
