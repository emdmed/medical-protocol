/**
 * Barrel export for all lib/ calculation modules.
 * Provides a single import point: import { calculateBMI, analyze, ... } from '../lib';
 */

export { safeParseFloat, safeParseFloatOrNull } from "./utils/safeParseFloat";

export { calculateBMI, getBMICategory } from "./bmi";

export { calculatePaFi, getPaFiClassification, getPaFiSeverity } from "./pafi";

export {
  calculateInsensibleLoss,
  calculateEndogenousGeneration,
  calculateDefecationLoss,
  calculateWaterBalance,
} from "./water-balance";

export { analyze } from "./acid-base";
export type { ABGValues, ABGResult } from "./acid-base";

export type {
  ASCVDInputs,
  HEARTInputs,
  CHADSVAScInputs,
} from "./cardiology-types";

export {
  calculateASCVD,
  getASCVDCategory,
  getASCVDSeverity,
  calculateHEARTScore,
  getHEARTCategory,
  getHEARTAction,
  getHEARTSeverity,
  calculateCHADSVASc,
  getCHADSVAScCategory,
  getCHADSVAScAction,
  getCHADSVAScSeverity,
} from "./cardiology";

export {
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
} from "./dka";

export {
  calculateRespirationSOFA,
  calculateCoagulationSOFA,
  calculateLiverSOFA,
  calculateCardiovascularSOFA,
  calculateCNSSOFA,
  calculateRenalSOFA,
  calculateTotalSOFA,
  calculateSOFADelta,
  calculateQSOFA,
  isQSOFAPositive,
  assessSepsis,
  assessSepticShock,
  assessBundleCompliance,
  calculateLactateClearance,
  isLactateClearanceAdequate,
  getSOFASeverityLevel,
  getSOFASeverity,
  hasVasopressors,
} from "./sepsis";
export type { SOFAReading } from "./sepsis";

export {
  calculateEGFR,
  classifyGFRCategory,
  getGFRCategoryLabel,
  classifyAlbuminuriaCategory,
  getAlbuminuriaCategoryLabel,
  getCKDRiskLevel,
  getMonitoringFrequency,
  calculateKFRE,
  assessReferralNeed,
  checkRASiEligibility,
  checkSGLT2iEligibility,
  checkFinerenoneEligibility,
  calculateEGFRSlope,
  isRapidDecline,
  hasSignificantEGFRChange,
  hasACRDoubling,
  classifyAnemia,
  assessIronStatus,
  checkESAEligibility,
  assessPhosphate,
  correctCalcium,
  assessPTH,
  assessVitaminD,
  getCKDMBDMonitoring,
  getCKDSeverity,
} from "./ckd";

export {
  classifyLDL,
  classifyHbA1c,
  classifyBPInCKD,
  classifyTriglycerides,
  classifyLpa,
  classifyNonHDL,
  classifyApoB,
  calculateNonHDL,
  getStatinIndication,
  calculateCaPhProduct,
  calculateCorrectedCalcium,
  classifyCalcium,
  classifyPhosphorus,
  classifyPTH,
  classifyVitaminD,
  classifyCaPhProduct,
  classifyHemoglobin,
  classifyFerritin,
  classifyTSAT,
  needsIronSupplementation,
  classifyAnemiaBySex,
  getPhosphateRecommendation,
  getPTHRecommendation,
  getVitaminDRecommendation,
} from "./nephrology";
export type { StatinIndicationInput } from "./nephrology";

export {
  calculateFIB4,
  getMASLDRiskStratification,
  getMASLDTreatmentRecommendation,
  countRiskFactors,
} from "./hepatology";

export {
  calculateAge,
} from "./patient";

export {
  CRITICAL_LIMITS,
  getBloodPressureSeverity,
  getHeartRateSeverity,
  getRespiratoryRateSeverity,
  getTemperatureSeverity,
  getBloodOxygenSeverity,
} from "./vital-signs-validations/severity";

export { Trace } from "./trace";
export type { TraceEntry } from "./trace";
export * as sources from "./sources";
