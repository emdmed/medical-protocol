/**
 * DKAMonitor — Hourly DKA tracking with glucose, ketones, potassium, insulin, GCS, urine output.
 *
 * @props
 *   data?   — DKAPatientData — initial patient data with readings
 *   onData? — (data: DKAPatientData) => void — fires on every change
 *
 * @usage
 *   <DKAMonitor />
 *   <DKAMonitor data={patientData} onData={setPatientData} />
 *
 * @behavior
 *   Header: patient weight + glucose unit toggle (mg/dL or mmol/L).
 *   Current status: latest reading badges (Glucose, Ketones, K+, GCS, Urine Output).
 *   Rate badges: inline showing reduction/increase rates vs targets.
 *   Resolution status: inline badges for each DKA criterion.
 *   Add reading: click to add hourly reading with all parameter inputs.
 *   Reading history: compact list of previous readings.
 *
 * @positioning
 *   All results render inline below inputs — no absolute positioning.
 */
import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Check,
  X,
  Activity,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import {
  calculateGlucoseReductionRate,
  isGlucoseOnTarget,
  calculateKetoneReductionRate,
  isKetoneOnTarget,
  calculateBicarbonateIncreaseRate,
  isBicarbonateOnTarget,
  classifyPotassium,
  getPotassiumSeverity,
  calculateUrineOutputRate,
  isUrineOutputOnTarget,
  classifyGCS,
  isGCSDecreasing,
  assessDKAResolution,
  suggestInsulinAdjustment,
} from "../../../../lib/dka";
import type { DKAPatientData, DKAReading, DKAProps } from "./types/dka";

const severityColor = (level: string): string => {
  switch (level) {
    case "normal":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "";
  }
};

const targetBadge = (onTarget: boolean, label: string) => (
  <Badge
    className={`text-[10px] ${onTarget ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}
  >
    {label}
  </Badge>
);

const DKAMonitor = ({ data, onData }: DKAProps) => {
  const [patientData, setPatientData] = useState<DKAPatientData>(
    data ?? { weight: "", glucoseUnit: "mgdl", readings: [] },
  );
  const [isAddingReading, setIsAddingReading] = useState(false);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [tempWeight, setTempWeight] = useState("");

  // New reading form
  const [newGlucose, setNewGlucose] = useState("");
  const [newKetones, setNewKetones] = useState("");
  const [newBicarbonate, setNewBicarbonate] = useState("");
  const [newPH, setNewPH] = useState("");
  const [newPotassium, setNewPotassium] = useState("");
  const [newInsulinRate, setNewInsulinRate] = useState("");
  const [newGCS, setNewGCS] = useState("");
  const [newUrineOutput, setNewUrineOutput] = useState("");

  const onDataRef = useRef(onData);
  onDataRef.current = onData;

  const prevDataRef = useRef<string>("");

  useEffect(() => {
    const serialized = JSON.stringify(patientData);
    if (serialized !== prevDataRef.current) {
      prevDataRef.current = serialized;
      onDataRef.current?.(patientData);
    }
  }, [patientData]);

  const latest = patientData.readings[patientData.readings.length - 1];
  const previous =
    patientData.readings.length >= 2
      ? patientData.readings[patientData.readings.length - 2]
      : null;

  const hoursBetween = (a: DKAReading, b: DKAReading): string => {
    const diff = (a.timestamp - b.timestamp) / 3600;
    return diff > 0 ? diff.toFixed(1) : "1";
  };

  // Rate calculations
  const hours = latest && previous ? hoursBetween(latest, previous) : null;
  const glucoseRate =
    latest && previous && hours
      ? calculateGlucoseReductionRate(latest.glucose, previous.glucose, hours)
      : null;
  const ketoneRate =
    latest && previous && hours
      ? calculateKetoneReductionRate(latest.ketones, previous.ketones, hours)
      : null;
  const bicarbRate =
    latest && previous && hours
      ? calculateBicarbonateIncreaseRate(
          latest.bicarbonate,
          previous.bicarbonate,
          hours,
        )
      : null;
  const urineRate =
    latest && patientData.weight && hours
      ? calculateUrineOutputRate(latest.urineOutput, patientData.weight, hours)
      : null;

  // Resolution
  const resolution = latest
    ? assessDKAResolution(
        latest.glucose,
        latest.ketones,
        latest.bicarbonate,
        latest.pH,
        patientData.glucoseUnit,
      )
    : null;

  // Insulin suggestion
  const insulinSuggestion =
    latest
      ? suggestInsulinAdjustment(
          latest.glucose,
          glucoseRate,
          latest.insulinRate,
          patientData.glucoseUnit,
        )
      : null;

  const toggleUnit = () => {
    setPatientData((prev) => ({
      ...prev,
      glucoseUnit: prev.glucoseUnit === "mgdl" ? "mmol" : "mgdl",
    }));
  };

  const saveWeight = () => {
    const w = parseFloat(tempWeight);
    if (w > 0) {
      setPatientData((prev) => ({ ...prev, weight: tempWeight }));
      setIsEditingHeader(false);
    }
  };

  const addReading = () => {
    const reading: DKAReading = {
      id: Date.now().toString(),
      timestamp: Math.floor(Date.now() / 1000),
      glucose: newGlucose,
      ketones: newKetones,
      bicarbonate: newBicarbonate,
      pH: newPH,
      potassium: newPotassium,
      insulinRate: newInsulinRate,
      gcs: newGCS,
      urineOutput: newUrineOutput,
    };

    setPatientData((prev) => ({
      ...prev,
      readings: [...prev.readings, reading],
    }));

    // Reset form
    setNewGlucose("");
    setNewKetones("");
    setNewBicarbonate("");
    setNewPH("");
    setNewPotassium("");
    setNewInsulinRate("");
    setNewGCS("");
    setNewUrineOutput("");
    setIsAddingReading(false);
  };

  const glucoseUnitLabel =
    patientData.glucoseUnit === "mgdl" ? "mg/dL" : "mmol/L";
  const labelClass = "text-xs opacity-60";

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      <Card className="overflow-visible">
        <CardContent className="p-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="font-semibold text-sm">DKA Monitor</span>
            </div>
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] ${patientData.glucoseUnit === "mgdl" ? "font-semibold" : "opacity-50"}`}
              >
                mg/dL
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleUnit}
                className="h-5 w-8 p-0 hover:bg-transparent"
              >
                {patientData.glucoseUnit === "mmol" ? (
                  <ToggleRight className="h-4 w-4" />
                ) : (
                  <ToggleLeft className="h-4 w-4" />
                )}
              </Button>
              <span
                className={`text-[10px] ${patientData.glucoseUnit === "mmol" ? "font-semibold" : "opacity-50"}`}
              >
                mmol/L
              </span>
            </div>
          </div>

          {/* Weight */}
          {isEditingHeader ? (
            <div className="flex items-center gap-2 mb-2">
              <Label className={labelClass}>Weight (kg)</Label>
              <Input
                value={tempWeight}
                onChange={(e) => setTempWeight(e.target.value)}
                className="text-end w-[70px] h-7"
                placeholder="kg"
              />
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={saveWeight}>
                <Check className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsEditingHeader(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div
              className="text-xs opacity-60 mb-2 cursor-pointer hover:opacity-100"
              onClick={() => {
                setTempWeight(patientData.weight);
                setIsEditingHeader(true);
              }}
            >
              Weight: {patientData.weight || "—"} kg
            </div>
          )}

          <Separator className="my-2" />

          {/* Current Status */}
          {latest ? (
            <div className="space-y-2">
              <div className="text-xs font-medium opacity-70">
                Latest reading
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge variant="outline" className="text-[10px]">
                  Glucose: {latest.glucose} {glucoseUnitLabel}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Ketones: {latest.ketones} mmol/L
                </Badge>
                <Badge
                  className={`text-[10px] ${severityColor(getPotassiumSeverity(latest.potassium))}`}
                >
                  K+: {latest.potassium} mEq/L (
                  {classifyPotassium(latest.potassium)})
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  GCS: {latest.gcs} ({classifyGCS(latest.gcs)})
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  pH: {latest.pH}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  HCO3: {latest.bicarbonate} mEq/L
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Insulin: {latest.insulinRate} U/hr
                </Badge>
              </div>

              {/* GCS Warning */}
              {previous && isGCSDecreasing(latest.gcs, previous.gcs) && (
                <Badge className="text-[10px] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                  ⚠ GCS drop ≥2 — consider cerebral edema
                </Badge>
              )}

              {/* Rate badges */}
              {hours && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">
                    Rates
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {glucoseRate &&
                      targetBadge(
                        isGlucoseOnTarget(glucoseRate, patientData.glucoseUnit),
                        `Glucose: ${glucoseRate} ${glucoseUnitLabel}/hr`,
                      )}
                    {ketoneRate &&
                      targetBadge(
                        isKetoneOnTarget(ketoneRate),
                        `Ketones: ${ketoneRate} mmol/L/hr`,
                      )}
                    {bicarbRate &&
                      targetBadge(
                        isBicarbonateOnTarget(bicarbRate),
                        `HCO3: +${bicarbRate} mmol/L/hr`,
                      )}
                    {urineRate &&
                      targetBadge(
                        isUrineOutputOnTarget(urineRate),
                        `Urine: ${urineRate} mL/kg/hr`,
                      )}
                  </div>
                </>
              )}

              {/* Insulin suggestion */}
              {insulinSuggestion && (
                <div className="text-[10px] opacity-70 italic">
                  {insulinSuggestion}
                </div>
              )}

              {/* Resolution */}
              {resolution && (
                <>
                  <div className="text-xs font-medium opacity-70 mt-2">
                    Resolution criteria
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {targetBadge(
                      resolution.criteria.glucose,
                      `Glucose <${patientData.glucoseUnit === "mgdl" ? "200" : "11.1"}`,
                    )}
                    {targetBadge(
                      resolution.criteria.ketones,
                      "Ketones <0.6",
                    )}
                    {targetBadge(
                      resolution.criteria.bicarbonate,
                      "HCO3 ≥15",
                    )}
                    {targetBadge(resolution.criteria.pH, "pH >7.30")}
                  </div>
                  {resolution.resolved && (
                    <Badge className="text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mt-1">
                      DKA Resolved
                    </Badge>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="text-xs opacity-50 text-center py-4">
              No readings yet. Add the first hourly reading.
            </div>
          )}

          <Separator className="my-2" />

          {/* Add Reading */}
          {isAddingReading ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">New reading</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={addReading}
                    disabled={!newGlucose}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setIsAddingReading(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className={labelClass}>
                    Glucose ({glucoseUnitLabel})
                  </Label>
                  <Input
                    value={newGlucose}
                    onChange={(e) => setNewGlucose(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Ketones (mmol/L)</Label>
                  <Input
                    value={newKetones}
                    onChange={(e) => setNewKetones(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>HCO3 (mEq/L)</Label>
                  <Input
                    value={newBicarbonate}
                    onChange={(e) => setNewBicarbonate(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>pH</Label>
                  <Input
                    value={newPH}
                    onChange={(e) => setNewPH(e.target.value)}
                    className="text-end h-7"
                    placeholder="7.00"
                  />
                </div>
                <div>
                  <Label className={labelClass}>K+ (mEq/L)</Label>
                  <Input
                    value={newPotassium}
                    onChange={(e) => setNewPotassium(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Insulin (U/hr)</Label>
                  <Input
                    value={newInsulinRate}
                    onChange={(e) => setNewInsulinRate(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className={labelClass}>GCS (3-15)</Label>
                  <Input
                    value={newGCS}
                    onChange={(e) => setNewGCS(e.target.value)}
                    className="text-end h-7"
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label className={labelClass}>Urine (mL)</Label>
                  <Input
                    value={newUrineOutput}
                    onChange={(e) => setNewUrineOutput(e.target.value)}
                    className="text-end h-7"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs"
              onClick={() => setIsAddingReading(true)}
            >
              <Plus className="h-3 w-3 mr-1" /> Add reading
            </Button>
          )}

          {/* Reading history */}
          {patientData.readings.length > 0 && (
            <>
              <Separator className="my-2" />
              <div className="text-xs font-medium opacity-70 mb-1">
                History ({patientData.readings.length} readings)
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...patientData.readings].reverse().map((r) => (
                  <div
                    key={r.id}
                    className="text-[10px] opacity-60 flex gap-2 flex-wrap"
                  >
                    <span>
                      {new Date(r.timestamp * 1000).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>
                      Glu {r.glucose} | Ket {r.ketones} | pH {r.pH} | K+{" "}
                      {r.potassium} | GCS {r.gcs}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      <MedicalDisclaimer />
    </div>
  );
};

export default DKAMonitor;
