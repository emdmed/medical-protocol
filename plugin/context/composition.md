# Component Composition Patterns

How to wire medical protocol components together. For individual component props and types, read the JSDoc header in each component file, or see `manifest.json` for a quick summary.

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

## Vitals feeding real-time PulseOximetry

```tsx
import VitalSigns from "@/components/vital-signs/vital-signs";
import PulseOximetry from "@/components/telemonitoring/pulse-oximetry/pulse-oximetry";

function MonitoringView() {
  const [vitals, setVitals] = useState<IVitalSignsData | null>(null);

  return (
    <div className="flex gap-4 items-start">
      <VitalSigns onData={(data) => setVitals(data)} />
      <PulseOximetry
        bpm={vitals?.heartRate ?? 0}
        spo2={vitals?.bloodOxygen?.saturation ?? 0}
        isBeating={!!vitals?.heartRate}
      />
    </div>
  );
}
```

## Timeline alongside vitals

```tsx
import Timeline from "@/components/timeline/timeline";
import VitalSigns from "@/components/vital-signs/vital-signs";
import type { TimelineItem } from "@/components/timeline/timeline";
import type { IVitalSignsData } from "@/components/vital-signs/types/vital-signs";

function PatientHistory({ events, currentVitals }: {
  events: TimelineItem[];
  currentVitals: IVitalSignsData;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-4">
      <VitalSigns data={currentVitals} editable={false} assistant={false} />
      <Timeline items={events} maxHeight="20rem" />
    </div>
  );
}
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

- **overflow-hidden clipping**: shadcn `Card` uses `overflow-hidden` by default. Add `overflow-visible` to any Card wrapping VitalSigns — its edit popups use absolute positioning. AcidBase result badges now render inline below inputs (no overflow fix needed).

- **Result overlap prevention**: Calculator result badges/output must always render **below** the input fields using inline flow — never above them using `absolute bottom-*`. Absolute positioning above inputs causes results to overlap the component title.

- **VitalSigns circular updates**: If your parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. The hook uses ref-based dedup internally, but external effect chains can still infinite-loop.

- **AcidBase fires onData(null) on mount**: Guard against null in your handler — it fires immediately before any user input.

- **Temperature units**: VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.

- **FHIR bundle**: The second argument to VitalSigns' `onData` is a FHIR R4 Bundle with LOINC codes. Always available (VitalSignsFhir renders internally).
