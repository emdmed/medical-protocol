# Composition Patterns

How to wire generated clinical screens together. Each screen is generated per project (see `building.md`) at `components/medprotocol/<module>/<module>.tsx`; its logic comes from `@/lib/medprotocol/<module>`.

**The props in these examples are the contract.** Every generated screen must expose exactly these prop names and shapes (`data`, `onData`, and the extra props listed per module in `{module}.md` → Screen spec), so screens compose without glue code. Types that describe lib inputs/outputs (e.g. `Result`) come from `@/lib/medprotocol/...`; screen data types (e.g. `IVitalSignsData`) are exported by the generated screen file.

---

## Dashboard: Multiple calculators in a grid

```tsx
import VitalSigns, { type IVitalSignsData } from "@/components/medprotocol/vital-signs/vital-signs";
import AcidBase from "@/components/medprotocol/acid-base/acid-base";
import WaterBalance from "@/components/medprotocol/water-balance/water-balance";
import BMI from "@/components/medprotocol/bmi/bmi";
import type { Result } from "@/lib/medprotocol/acid-base/interfaces";

function Dashboard() {
  const [vitals, setVitals] = useState<IVitalSignsData | null>(null);
  const [abgResult, setAbgResult] = useState<Result | null>(null);

  return (
    <div className="grid grid-cols-2 gap-4">
      <VitalSigns onData={(data) => setVitals(data)} editable />
      <AcidBase onData={(result) => setAbgResult(result)} />
      <WaterBalance data={{ weight: 70 }} />
      <BMI />
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
  border={false}
/>
```

## Collecting data from multiple screens into one submission

```tsx
import VitalSigns, { type IVitalSignsData, type FhirBundle } from "@/components/medprotocol/vital-signs/vital-signs";
import AcidBase from "@/components/medprotocol/acid-base/acid-base";
import type { Result } from "@/lib/medprotocol/acid-base/interfaces";

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

## ICU dashboard with PaFi and DKA monitoring

```tsx
import VitalSigns from "@/components/medprotocol/vital-signs/vital-signs";
import AcidBase from "@/components/medprotocol/acid-base/acid-base";
import PaFi from "@/components/medprotocol/pafi/pafi";
import DKA, { type DKAPatientData } from "@/components/medprotocol/dka/dka";

function ICUDashboard() {
  const [dkaData, setDkaData] = useState<DKAPatientData | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <VitalSigns onData={(data) => {}} editable />
      <AcidBase onData={(result) => {}} />
      <PaFi />
      <DKA data={dkaData ?? undefined} onData={setDkaData} />
    </div>
  );
}
```

## Cross-tool data flow: Patient wiring

When `patient` and dependent screens share a dashboard, use Patient as the single source of truth for demographics. Pass its fields down instead of letting each screen collect age/sex/weight inline.

```tsx
import Patient, { type PatientData } from "@/components/medprotocol/patient/patient";
import CKD, { type CKDPatientData } from "@/components/medprotocol/ckd/ckd";
import DKA, { type DKAPatientData } from "@/components/medprotocol/dka/dka";
import BMI from "@/components/medprotocol/bmi/bmi";

function Dashboard() {
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [ckdData, setCkdData] = useState<CKDPatientData>(EMPTY_CKD);   // empty defaults per module
  const [dkaData, setDkaData] = useState<DKAPatientData>(EMPTY_DKA);

  return (
    <div className="space-y-6">
      {/* Patient card: full-width, above the grid */}
      <Patient onData={(data) => setPatient(data)} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CKD
          data={{
            ...ckdData,
            age: String(patient?.age ?? ""),
            sex: patient?.sex ?? "",
          }}
          onData={setCkdData}
        />
        <DKA
          data={{
            ...dkaData,
            weight: patient?.weight ?? "",
          }}
          onData={setDkaData}
        />
        <BMI
          data={{
            weight: patient?.weight,
            heightM: patient?.height ? String(Number(patient.height) / 100) : undefined, // cm → m
            isMetric: true,
          }}
        />
      </div>
    </div>
  );
}
```

**Which fields each screen consumes from Patient:**

| Screen | Fields |
|---|---|
| ckd / nephrology | age, sex |
| cardiology | age, sex |
| diabetes-dx | age, sex |
| hepatology | age |
| dka | weight |
| sepsis | weight |
| water-balance | weight (as number) |
| bmi | weight, height (cm → m) |

## CKD → Nephrology wiring

```tsx
import CKD, { type CKDPatientData } from "@/components/medprotocol/ckd/ckd";
import Anemia from "@/components/medprotocol/nephrology/anemia";
import PhosphoCalcic from "@/components/medprotocol/nephrology/phospho-calcic";
import CardioMetabolic from "@/components/medprotocol/nephrology/cardio-metabolic";

const latest = ckd.readings.at(-1);

<CKD data={ckd} onData={setCkd} />
<Anemia data={anemia} onData={setAnemia} sex={ckd.sex} />
<PhosphoCalcic data={mbd} onData={setMbd} gfrCategory={latest?.gfrCategory} />
<CardioMetabolic
  data={lipids}
  onData={setLipids}
  gfrCategory={latest?.gfrCategory}
  age={Number(ckd.age) || null}
  hasDiabetes={ckd.hasDiabetes}
  hasPriorCVD={ckd.hasPriorCVD}
  hasKidneyTransplant={ckd.hasKidneyTransplant}
/>
```

---

## Overlay tagging contract (`data-medprotocol-*`) — optional fast-path

> **The overlay does not require these tags.** Its job is to retrofit medical protocol into apps
> built *without* it, so by default it selects **any** DOM element and captures a CSS selector +
> `outerHTML` for the agent to classify (see `context/overlay.md`). These attributes are an
> **optional fast-path**: when an app *is* already medprotocol-based, they let Audit/Implement skip
> classification and resolve straight to the registry id + source. Emit them when you can; nothing
> breaks when they're absent.

The dev overlay (served by `medprotocol overlay --serve`) lets a user hover a rendered element, select it, and queue an **Audit** or **Implement** work order. When present, these attributes are read off the selected node (or its nearest tagged ancestor):

```html
<div
  data-medprotocol-id="bmi"                  <!-- optional: registry id (see components.md) -->
  data-medprotocol-source="medprotocol/bmi/bmi.tsx" <!-- optional: source path for Audit/Implement -->
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
- `data-medprotocol-id`, if set, should match a registry id in `components.md` exactly.
- Attributes are inert in production; the overlay only mounts in dev. They add no runtime behavior, just a selection fast-path.

Every selection (tagged or not) writes a work order to `.medprotocol/queue/` — see `context/overlay.md` for the queue schema and the Audit/Implement semantics.

---

## Gotchas

- **Result placement**: results always render **below** the inputs in normal flow — never overlaid above them with absolute positioning (overlaps the title).

- **Circular updates**: if a parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. Dedup with a ref holding the last serialized value.

- **AcidBase fires onData(null)**: it reports `null` until pH, pCO2 and HCO3 are filled. Guard against null in your handler.

- **Temperature units**: VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.

- **FHIR bundle**: the second argument to VitalSigns' `onData` is a FHIR R4 Bundle with LOINC codes.

- **Strings vs numbers**: vital signs and patient age are numbers; most lib functions and reading fields are strings. Convert at the boundary: `String(value ?? "")`.

- **Inbound data sync required**: screens that accept a `data` prop fed by another screen must sync prop changes into local state — not just read the prop on mount. Without this, parent updates (e.g. age/sex changed in the Patient card) never reach the child. Pattern: compare `JSON.stringify(data)` against a `prevDataRef` and call `setState` only when changed.

- **Patient data cascading**: when patient data changes, dependents update via props. Use the same ref-based dedup to prevent re-render cascades in screens that both receive `data` and emit `onData`.

- **Multi-patient dashboards — use `key={activeId}`**: when a dashboard switches between patients, add `key={activeId}` to every screen (and its error boundary). This forces a clean remount on switch, preventing stale state from one patient bleeding into another.
