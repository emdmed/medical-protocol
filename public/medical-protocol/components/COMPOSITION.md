# Building Block Toolkit

Each component below is a self-contained **block** — a focused clinical tool that works on its own or wired together with others. Think of them as ingredients: pick the ones you need, combine them into a dashboard, embed them inside a note editor, or use one standalone.

For individual block props and types, read the JSDoc header in each component file, or see `manifest.json` for a quick summary.

---

## Block Catalog

| Block | Category | What it does |
|-------|----------|-------------|
| **vital-signs** | Monitoring | Editable BP, HR, RR, Temp, SpO2/FiO2 with alerts and AI analysis |
| **acid-base** | Calculator | ABG analyzer — disorder detection, compensation, anion gap |
| **bmi** | Calculator | BMI calculator with imperial/metric toggle |
| **water-balance** | Calculator | Fluid intake/output tracker with insensible loss |
| **telemonitoring** | Monitoring | Real-time pulse oximetry animation (BPM + SpO2) |
| **timeline** | Display | Scrollable clinical timeline with event popovers |
| **clinical-notes** | Documentation | Encounter note editor with highlighting, tools, and local storage |

---

## Recipes

### Dashboard: Multiple blocks in a grid

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

### Read-only vitals (no editing, no border)

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

### Vitals feeding real-time PulseOximetry

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

### Timeline alongside vitals

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

### Collecting data from multiple blocks into one submission

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

## Gotchas

- **overflow-hidden clipping**: shadcn `Card` uses `overflow-hidden` by default. Add `overflow-visible` to any Card wrapping VitalSigns or AcidBase — their popups use absolute positioning and will be clipped otherwise:
  - **VitalSigns**: edit buttons (`absolute bottom-10`, above inputs), alert badges (`absolute bottom-[-22px]`, below inputs), AI analysis card (`absolute top-12 z-50`, below the component)
  - **AcidBase**: result popup (`absolute bottom-15 left-0`, above inputs)
  - Components that use shadcn portals (Timeline Popover, ClinicalNotes AlertDialog/Drawer/Select) do NOT need this fix — portals render outside the DOM tree.

- **VitalSigns circular updates**: If your parent passes `data` and listens to `onData`, don't re-pass the same data back down in a useEffect loop. The hook uses ref-based dedup internally, but external effect chains can still infinite-loop.

- **AcidBase fires onData(null) on mount**: Guard against null in your handler — it fires immediately before any user input.

- **Temperature units**: VitalSigns stores temperature in the unit set by `useFahrenheit`. Normalize before passing cross-source data.

- **FHIR bundle**: The second argument to VitalSigns' `onData` is a FHIR R4 Bundle with LOINC codes. Always available (VitalSignsFhir renders internally).
