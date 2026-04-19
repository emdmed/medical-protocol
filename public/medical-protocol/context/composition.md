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

## Gotchas

- **Group installs**: For nephrology dashboards, use `npx medical-ui-cli add nephrology` (group) to install both `ckd/` and `nephrology/` folders at once. Sub-component aliases (`anemia`, `phospho-calcic`, `cardio-metabolic`) install just the `nephrology/` folder.

- **overflow-hidden clipping**: shadcn `Card` uses `overflow-hidden` by default. Add `overflow-visible` to any Card wrapping VitalSigns — its edit popups use absolute positioning. AcidBase result badges now render inline below inputs (no overflow fix needed).

- **Result overlap prevention**: Calculator result badges/output must always render **below** the input fields using inline flow — never above them using `absolute bottom-*`. Absolute positioning above inputs causes results to overlap the component title.

- **VitalSigns circular updates**: If your parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. The hook uses ref-based dedup internally, but external effect chains can still infinite-loop.

- **AcidBase fires onData(null) on mount**: Guard against null in your handler — it fires immediately before any user input.

- **Temperature units**: VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.

- **FHIR bundle**: The second argument to VitalSigns' `onData` is a FHIR R4 Bundle with LOINC codes. Always available (VitalSignsFhir renders internally).
