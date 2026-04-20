git-sha: 3c99a578b93b025bd46bc4d764c239cbbbdb3f2e
## Entry Points
lib/ckd.ts (25), lib/sepsis.ts (18), lib/dka.ts (14), lib/cardiology.ts (11), lib/vital-signs-validations/temperature-validations.ts (7)
## lib/acid-base/analyze.ts
fn: analyze({ values, isChronic }})+:4
## lib/acid-base/index.ts
types: ABGValues:6, ABGResult:15
## lib/acid-base/interfaces.ts
types: Values:1, ExpectedValues:10, Result:15
## lib/bmi.ts
fn: calculateBMI(w, hFt, hIn, hM, metric,)+:11
fn: getBMICategory(bmi)+:36
const: MAX_WEIGHT_KG, MAX_WEIGHT_LBS, MAX_HEIGHT_M, MAX_HEIGHT_IN
## lib/cardiology-types.ts
types: ASCVDInputs:4, HEARTInputs:17, CHADSVAScInputs:26
## lib/cardiology.ts
fn: calculateASCVD(inputs)+:112
fn: getASCVDCategory(risk)+:159
fn: getASCVDSeverity(risk)+:169
fn: calculateHEARTScore(inputs)+:181
fn: getHEARTCategory(score)+:185
fn: getHEARTAction(score)+:191
fn: getHEARTSeverity(score)+:197
fn: calculateCHADSVASc(inputs)+:205
fn: getCHADSVAScCategory(score, isFemale)+:219
fn: getCHADSVAScAction(score, isFemale)+:231
fn: getCHADSVAScSeverity(score, isFemale)+:242
const: COEFFICIENTS
types: CoxCoefficients:23
## lib/ckd.ts
fn: calculateEGFR(creatinine, age, sex,)+:15
fn: classifyGFRCategory(egfr,)+:43
fn: getGFRCategoryLabel(category)+:58
fn: classifyAlbuminuriaCategory(acr,)+:75
fn: getAlbuminuriaCategoryLabel(category)+:87
fn: getCKDRiskLevel(gfrCategory, albCategory,)+:102
fn: getMonitoringFrequency(gfrCategory, albCategory,)+:122
fn: calculateKFRE(age, sex, egfr, acr,)+:145
fn: assessReferralNeed(kfre5yr,)+:182
fn: checkRASiEligibility(gfrCategory, albCategory, hasDiabetes,)+:198
fn: checkSGLT2iEligibility(egfr, acr, hasHeartFailure,)+:214
fn: checkFinerenoneEligibility(egfr, acr, hasDiabetes, onMaxRASi, potassiumNormal,)+:231
fn: calculateEGFRSlope(readings,)+:255
fn: isRapidDecline(slope)+:308
fn: hasSignificantEGFRChange(previous, current,)+:316
fn: hasACRDoubling(previous, current,)+:330
fn: classifyAnemia(hemoglobin, sex,)+:347
fn: assessIronStatus(ferritin, tsat,)+:367
fn: checkESAEligibility(hemoglobin, ferritin, tsat, sex,)+:392
fn: assessPhosphate(phosphate, gfrCategory,)+:420
fn: correctCalcium(calcium, albumin,)+:449
fn: assessPTH(pth, gfrCategory,)+:465
fn: assessVitaminD(vitaminD25OH,)+:491
fn: getCKDMBDMonitoring(gfrCategory,)+:505
fn: getCKDSeverity(gfrCategory,)+:545
## lib/dka.ts
fn: calculateGlucoseReductionRate(current, previous, hours,)+:50
fn: isGlucoseOnTarget(rate, unit)+:69
fn: calculateKetoneReductionRate(current, previous, hours,)+:80
fn: isKetoneOnTarget(rate)+:97
fn: calculateBicarbonateIncreaseRate(current, previous, hours,)+:107
fn: isBicarbonateOnTarget(rate)+:125
fn: classifyPotassium(value)+:134
fn: getPotassiumSeverity(value)+:147
fn: calculateUrineOutputRate(volume, weight, hours,)+:161
fn: isUrineOutputOnTarget(rate)+:178
fn: classifyGCS(value)+:187
fn: isGCSDecreasing(current, previous)+:200
fn: assessDKAResolution(glucose, ketones, bicarbonate, pH, unit,)+:214
fn: suggestInsulinAdjustment(glucose, rate, insulinRate, unit,)+:246
const: GLUCOSE_TARGET_RATE, GLUCOSE_RESOLUTION, GLUCOSE_REDUCTION_THRESHOLD, KETONE_TARGET_RATE, KETONE_RESOLUTION +9 more
## lib/format.ts
fn: formatJson(data)+:5
fn: formatTable(rows, string][])+:9
fn: formatHeader(title)+:16
fn: formatError(message)+:20
fn: printResult(data, json, humanFn)+:24
## lib/index.ts
## lib/pafi.ts
fn: calculatePaFi(paO2, fiO2)+:7
fn: getPaFiClassification(paFi)+:19
fn: getPaFiSeverity(paFi)+:29
## lib/sepsis.ts
fn: calculateRespirationSOFA(paO2, fiO2, onVentilation,)+:14
fn: calculateCoagulationSOFA(platelets)+:36
fn: calculateLiverSOFA(bilirubin)+:50
fn: calculateCardiovascularSOFA(map, dopamine, dobutamine, epinephrine, norepinephrine,)+:65
fn: calculateCNSSOFA(gcs)+:93
fn: calculateRenalSOFA(creatinine, urineOutput, weight, hours,)+:108
fn: calculateTotalSOFA(reading}, weight, hours,)+:154
fn: calculateSOFADelta(current, baseline)+:181
fn: calculateQSOFA(respiratoryRate, sbp, gcs,)+:191
fn: isQSOFAPositive(score)+:211
fn: assessSepsis(sofaScore, sofaDelta, suspectedInfection,)+:218
fn: assessSepticShock(hasSepsis, vasopressorsNeeded, lactate,)+:230
fn: assessBundleCompliance(bundle}, currentTime,)+:246
fn: calculateLactateClearance(initial, repeat,)+:284
fn: isLactateClearanceAdequate(clearance)+:299
fn: getSOFASeverityLevel(score,)+:310
fn: getSOFASeverity(score,)+:322
fn: hasVasopressors(dopamine, dobutamine, epinephrine, norepinephrine,)+:333
## lib/utils/safeParseFloat.ts
fn: safeParseFloat(value)+:5
fn: safeParseFloatOrNull(value)+:15
## lib/vital-signs-validations/blood-oxygen-validations.ts
const: bloodOxygenValidations, hasValidBloodOxygenInput, hasValidFio2Input, BloodOxygenValidations
## lib/vital-signs-validations/blood-pressure-validations.ts
fn: validateBloodPressureInput(bloodPressureValue?)+:21
fn: isValidBloodPressureInput(value, type)+:46
fn: getBloodPressureCategory(systolic, diastolic)+:62
fn: parseBloodPressureValues(bloodPressureValue?)+:82
const: BLOOD_PRESSURE_LIMITS
## lib/vital-signs-validations/heart-rate-validations.ts
fn: validateHeartRateInput(value)+:14
fn: getHeartRateCategory(heartRate)+:19
fn: parseHeartRateValue(value)+:33
const: HEART_RATE_LIMITS
types: HeartRateCategory:1
## lib/vital-signs-validations/respiratory-rate-validations.ts
fn: validateRespiratoryRateInput(value)+:16
fn: isValidRespiratoryRateInput(value)+:26
fn: getRespiratoryRateCategory(respiratoryRate)+:35
fn: parseRespiratoryRateValue(value)+:51
const: RESPIRATORY_RATE_LIMITS
types: RespiratoryRateValidation:3, RespiratoryRateCategory:1
## lib/vital-signs-validations/temperature-validations.ts
fn: validateTemperatureInput(value, useFahrenheit= true)+:28
fn: isElevatedTemperature(temperature, useFahrenheit= true)+:39
fn: isLowTemperature(temperature, useFahrenheit= true)+:52
fn: getTemperatureStatus(temperature, useFahrenheit= true)+:65
fn: parseTemperatureValue(value)+:92
fn: getTemperatureLimits(useFahrenheit= true)+:98
fn: getTemperatureStatusCli(temperature, useFahrenheit= true,)+:107
const: TEMPERATURE_LIMITS
types: TemperatureStatus:1, TemperatureStatusCli:102
## lib/vital-signs-validations/types.ts
types: BloodPressureValue:1, BloodPressureCategory:6
## lib/water-balance.ts
fn: calculateInsensibleLoss(weightKg)+:18
fn: calculateEndogenousGeneration(weightKg)+:22
fn: calculateDefecationLoss(count)+:26
fn: calculateWaterBalance(weight, fluidIntakeOral, fluidIntakeIV, diuresis, defecationCount,)+:30
const: INSENSIBLE_LOSS_ML_PER_KG_DAY, ENDOGENOUS_GENERATION_ML_PER_KG_DAY, DEFECATION_LOSS_ML_PER_STOOL
## packages/medical-protocol/src/commands/check.ts
fn: run(argv)+:9
## packages/medical-protocol/src/commands/install.ts
fn: run(argv)+:9
fn: registerPlugin(settingsPath):93
const: PLUGIN_KEY
## packages/medical-protocol/src/commands/update.ts
fn: run(argv)+:9
fn: registerPlugin(settingsPath):143
const: PLUGIN_KEY
## packages/medical-protocol/src/files.ts
fn: getBundledPluginDir()+:6
fn: getTargetDir(baseDir)+:11
fn: listFiles(dir)+:15
fn: copyFile(src, dest)+:34
const: PLUGIN_DIR_NAME
## packages/medical-protocol/src/index.ts
const: USAGE, command, commandArgs, commands, loader
## packages/medical-protocol/src/manifest.ts
fn: hashFile(filePath)+:13
fn: readManifest(pluginDir)+:19
fn: writeManifest(pluginDir, manifest)+:29
const: MANIFEST_NAME
types: FileManifest:5
## packages/medprotocol/src/commands/abg.ts
fn: run(argv)+:22
const: USAGE
## packages/medprotocol/src/commands/bmi.ts
fn: run(argv)+:20
const: USAGE
## packages/medprotocol/src/commands/cardiology.ts
fn: runASCVD(argv, json):66
fn: runHEART(argv, json):166
fn: runCHADSVASc(argv, json):245
fn: run(argv)+:310
const: USAGE
## packages/medprotocol/src/commands/ckd.ts
fn: runEGFR(argv, json):85
fn: runStage(argv, json):135
fn: runKFRE(argv, json):199
fn: runTreatment(argv, json):253
fn: runAnemia(argv, json):318
fn: runMBD(argv, json):379
fn: run(argv)+:453
const: USAGE
## packages/medprotocol/src/commands/dka.ts
fn: run(argv)+:28
const: USAGE
## packages/medprotocol/src/commands/pafi.ts
fn: run(argv)+:17
const: USAGE
## packages/medprotocol/src/commands/sepsis.ts
fn: runSOFA(argv, json):63
fn: runQSOFA(argv, json):156
fn: runLactate(argv, json):212
fn: run(argv)+:264
const: USAGE
## packages/medprotocol/src/commands/vitals.ts
fn: run(argv)+:40
const: USAGE
## packages/medprotocol/src/commands/water-balance.ts
fn: run(argv)+:26
const: USAGE
## packages/medprotocol/src/index.ts
const: USAGE, command, commandArgs, commands, loader
## tests/acid-base/analyze.test.ts
fn: abg(pH, pCO2, HCO3, Na = , Cl = , Albumin =):5
fn: abgChronic(pH, pCO2, HCO3, Na = , Cl = , Albumin =):17
## tests/acid-base/safeFloat.test.ts
## tests/bmi/bmi-calculator.test.ts
## tests/cardiology/cardiology.test.ts
const: baseASCVD, baseHEART, baseCHADS
## tests/ckd/ckd.test.ts
## tests/cli/abg-cli.test.ts
## tests/cli/bmi-cli.test.ts
## tests/cli/cardiology-cli.test.ts
## tests/cli/ckd-cli.test.ts
## tests/cli/dka-cli.test.ts
## tests/cli/pafi-cli.test.ts
## tests/cli/sepsis-cli.test.ts
## tests/cli/vitals-cli.test.ts
## tests/cli/water-balance-cli.test.ts
## tests/dka/dka.test.ts
## tests/pafi/pafi.test.ts
## tests/sepsis/sepsis.test.ts
## tests/vital-signs/blood-oxygen-validations.test.ts
## tests/vital-signs/blood-pressure-validations.test.ts
## tests/vital-signs/heart-rate-validations.test.ts
## tests/vital-signs/respiratory-rate-validations.test.ts
## tests/vital-signs/temperature-validations.test.ts
## tests/water-balance/water-balance.test.ts
## vitest.config.ts