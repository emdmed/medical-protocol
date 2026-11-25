import { describe, expect, it } from 'vitest';
import {
  assessRespiratoryFailure,
  RESPIRATORY_FAILURE_LIMITS,
  type RespiratoryFailureAssessment,
  type RespiratoryFailureInput,
} from '../../plugin/lib/respiratory-failure';

type Expected = Omit<RespiratoryFailureAssessment, 'measured' | 'arterialGas' | 'notCalculated'>;

// alkor's respiratory-failure-extraction-cases.json: evidence camelCased, nulls left out, numbers as
// strings, the case's measured rate and SpO2 as inputs.
const CASES: [string, RespiratoryFailureInput, Expected][] = [
  ["rf-01-hypoxaemic-distress", {"oxygenSupport":"room_air","accessoryMuscles":"present","speech":"limited","cyanosis":"absent","respiratoryRate":"34","oxygenSaturation":"84"}, {"failure":"present","failureReason":"hypoxaemia","hypoxaemia":"present","hypercapnia":"not_determined","distress":"present","distressSigns":["respiratory_rate","accessory_muscles","speech"],"next":["arterial_blood_gas"]}],
  ["rf-02-copd-hypercapnic", {"oxygenSupport":"supplemental_oxygen","accessoryMuscles":"present","speech":"full_sentences","bloodGas":"arterial","gasUnit":"kPa","ph":"7.26","po2":"7.6","pco2":"9.1","hco3":"30","respiratoryRate":"28","oxygenSaturation":"89"}, {"failure":"present","failureReason":"hypoxaemia_and_hypercapnia","hypoxaemia":"present","hypercapnia":"present","distress":"present","distressSigns":["accessory_muscles"],"next":[]}],
  ["rf-03-breathless-not-distressed", {"oxygenSupport":"room_air","speech":"full_sentences","respiratoryRate":"18","oxygenSaturation":"97"}, {"failure":"absent","failureReason":"adequate_on_room_air","hypoxaemia":"absent","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":[]}],
  ["rf-04-adequate-on-oxygen", {"oxygenSupport":"supplemental_oxygen","accessoryMuscles":"absent","respiratoryRate":"22","oxygenSaturation":"95"}, {"failure":"indeterminate","failureReason":"adequate_on_support","hypoxaemia":"not_determined","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":["room_air_saturation"]}],
  ["rf-05-oxygen-not-stated", {"respiratoryRate":"20","oxygenSaturation":"93"}, {"failure":"indeterminate","failureReason":"oxygen_support_not_stated","hypoxaemia":"not_determined","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":["oxygen_support"]}],
  ["rf-06-no-saturation", {"accessoryMuscles":"present","speech":"limited","respiratoryRate":"32"}, {"failure":"indeterminate","failureReason":"no_oxygenation_measure","hypoxaemia":"not_determined","hypercapnia":"not_determined","distress":"present","distressSigns":["respiratory_rate","accessory_muscles","speech"],"next":["oxygen_saturation","arterial_blood_gas"]}],
  ["rf-07-venous-gas-only", {"oxygenSupport":"room_air","speech":"full_sentences","cyanosis":"absent","bloodGas":"venous","gasUnit":"kPa","ph":"7.31","pco2":"7.9","hco3":"29","respiratoryRate":"16","oxygenSaturation":"92"}, {"failure":"indeterminate","failureReason":"venous_gas_only","hypoxaemia":"absent","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":["arterial_blood_gas"]}],
  ["rf-08-silent", {}, {"failure":"indeterminate","failureReason":"no_oxygenation_measure","hypoxaemia":"not_determined","hypercapnia":"not_determined","distress":"not_assessed","distressSigns":[],"next":["oxygen_saturation","respiratory_rate"]}],
  ["rf-09-tiring-asthmatic", {"oxygenSupport":"supplemental_oxygen","speech":"limited","cyanosis":"present","bloodGas":"arterial","gasUnit":"kPa","ph":"7.22","po2":"8.0","pco2":"8.5","hco3":"24","respiratoryRate":"12","oxygenSaturation":"86"}, {"failure":"present","failureReason":"hypoxaemia_and_hypercapnia","hypoxaemia":"present","hypercapnia":"present","distress":"present","distressSigns":["speech","cyanosis"],"next":[]}],
  ["rf-10-ventilated", {"oxygenSupport":"invasive_ventilation","bloodGas":"arterial","gasUnit":"mmHg","ph":"7.38","po2":"88","pco2":"42","hco3":"24","respiratoryRate":"16","oxygenSaturation":"96"}, {"failure":"indeterminate","failureReason":"adequate_on_support","hypoxaemia":"not_determined","hypercapnia":"absent","distress":"absent","distressSigns":[],"next":[]}],
  ["rf-11-insuficiencia-es", {"oxygenSupport":"room_air","accessoryMuscles":"present","speech":"limited","cyanosis":"absent","bloodGas":"arterial","gasUnit":"mmHg","ph":"7.46","po2":"52","pco2":"30","hco3":"22","respiratoryRate":"32","oxygenSaturation":"87"}, {"failure":"present","failureReason":"hypoxaemia","hypoxaemia":"present","hypercapnia":"absent","distress":"present","distressSigns":["respiratory_rate","accessory_muscles","speech"],"next":[]}],
  ["rf-12-negatives-at-the-cut", {"oxygenSupport":"room_air","accessoryMuscles":"absent","speech":"full_sentences","paradoxicalBreathing":"absent","cyanosis":"absent","respiratoryRate":"24","oxygenSaturation":"90"}, {"failure":"absent","failureReason":"adequate_on_room_air","hypoxaemia":"absent","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":[]}],
  ["rf-13-impression-not-a-gas", {"oxygenSupport":"supplemental_oxygen","accessoryMuscles":"absent","speech":"full_sentences","respiratoryRate":"30","oxygenSaturation":"88"}, {"failure":"present","failureReason":"hypoxaemia","hypoxaemia":"present","hypercapnia":"not_determined","distress":"present","distressSigns":["respiratory_rate"],"next":["arterial_blood_gas"]}],
  ["rf-14-previous-intubation", {"oxygenSupport":"supplemental_oxygen","accessoryMuscles":"absent","speech":"full_sentences","respiratoryRate":"20","oxygenSaturation":"92"}, {"failure":"indeterminate","failureReason":"adequate_on_support","hypoxaemia":"not_determined","hypercapnia":"not_determined","distress":"absent","distressSigns":[],"next":["room_air_saturation"]}],
];

describe('assessRespiratoryFailure: alkor rf-* answer keys', () => {
  it.each(CASES)('%s', (_, input, expected) => {
    const { measured, arterialGas, notCalculated, ...rest } = assessRespiratoryFailure(input);
    expect(rest).toEqual(expected);
    expect(notCalculated).toEqual([]);
  });

  it('covers all 14 rf-* cases', () => {
    expect(CASES.map(([name]) => name.slice(0, 5))).toEqual(Array.from({ length: 14 }, (_, i) => `rf-${String(i + 1).padStart(2, '0')}`));
  });
});

describe('assessRespiratoryFailure: keep-rules', () => {
  it('a normal number on oxygen is indeterminate, not absent', () => {
    for (const oxygenSupport of ['supplemental_oxygen', 'non_invasive_ventilation', 'invasive_ventilation'] as const) {
      const r = assessRespiratoryFailure({ oxygenSupport, oxygenSaturation: '98', respiratoryRate: '16' });
      expect(r).toMatchObject({ failure: 'indeterminate', failureReason: 'adequate_on_support', hypoxaemia: 'not_determined' });
    }
    const gas = assessRespiratoryFailure({ oxygenSupport: 'invasive_ventilation', bloodGas: 'arterial', gasUnit: 'mmHg', po2: '95' });
    expect(gas.failure).toBe('indeterminate');
  });

  it('a normal number with no stated room air is not reassurance', () => {
    const r = assessRespiratoryFailure({ oxygenSaturation: '99' });
    expect(r).toMatchObject({ failure: 'indeterminate', failureReason: 'oxygen_support_not_stated', hypoxaemia: 'not_determined' });
    expect(r.next).toContain('oxygen_support');
    expect(assessRespiratoryFailure({ oxygenSupport: 'room_air', oxygenSaturation: '99' }).failure).toBe('absent');
  });

  it('a venous pCO2 is not a PaCO2', () => {
    const gas = { gasUnit: 'mmHg', ph: '7.20', pco2: '75', hco3: '28' } as const;
    const venous = assessRespiratoryFailure({ ...gas, bloodGas: 'venous', oxygenSupport: 'room_air', oxygenSaturation: '96' });
    expect(venous).toMatchObject({ failure: 'indeterminate', failureReason: 'venous_gas_only', hypercapnia: 'not_determined', arterialGas: null });
    expect(venous.next).toContain('arterial_blood_gas');
    expect(assessRespiratoryFailure({ ...gas, bloodGas: 'arterial' })).toMatchObject({ hypercapnia: 'present', failure: 'present' });
  });

  it('hypercapnia without an arterial gas is not_determined, never absent', () => {
    for (const input of [{}, { oxygenSupport: 'room_air', oxygenSaturation: '97' }, { bloodGas: 'venous', pco2: '40' }] as RespiratoryFailureInput[]) {
      expect(assessRespiratoryFailure(input).hypercapnia).toBe('not_determined');
    }
  });
});

describe('assessRespiratoryFailure', () => {
  it('converts kPa and rounds to a tenth: 8.0 kPa is 60.0 mmHg, at the line and not below it', () => {
    const r = assessRespiratoryFailure({ oxygenSupport: 'room_air', bloodGas: 'arterial', gasUnit: 'kPa', po2: '8.0', pco2: '5.0', ph: '7.40', hco3: '24' });
    expect(r.arterialGas).toMatchObject({ unit: 'kPa', po2MmHg: 60, pco2MmHg: 37.5, disorder: 'Normal' });
    expect(r.hypoxaemia).toBe('absent');
  });

  it('infers the unit from the pCO2 when none is written', () => {
    expect(assessRespiratoryFailure({ bloodGas: 'arterial', pco2: '9' }).arterialGas?.unit).toBe('kPa');
    expect(assessRespiratoryFailure({ bloodGas: 'arterial', pco2: '60' }).arterialGas?.unit).toBe('mmHg');
    expect(assessRespiratoryFailure({ bloodGas: 'arterial', po2: '8' }).arterialGas).toMatchObject({ unit: null, po2MmHg: null });
  });

  it('a compensated retainer is not hypercapnic failure', () => {
    const r = assessRespiratoryFailure({ bloodGas: 'arterial', gasUnit: 'mmHg', ph: '7.38', pco2: '58', hco3: '34' });
    expect(r.arterialGas?.disorder).not.toBe(RESPIRATORY_FAILURE_LIMITS.hypercapnicDisorder);
    expect(r.hypercapnia).toBe('absent');
  });

  it('a rate at the distress line meets it; one under does not', () => {
    const at = String(RESPIRATORY_FAILURE_LIMITS.distressRespiratoryRateAtLeast);
    expect(assessRespiratoryFailure({ respiratoryRate: at }).distressSigns).toEqual(['respiratory_rate']);
    expect(assessRespiratoryFailure({ respiratoryRate: '29' }).distress).toBe('absent');
  });

  it('a saturation the validation refuses is listed, not guessed around', () => {
    const r = assessRespiratoryFailure({ oxygenSupport: 'room_air', oxygenSaturation: '65' });
    expect(r).toMatchObject({ failure: 'indeterminate', failureReason: 'saturation_not_calculated' });
    expect(r.notCalculated).toEqual(['saturation 65%: SpO2 value must be at least 70%']);
  });
});
