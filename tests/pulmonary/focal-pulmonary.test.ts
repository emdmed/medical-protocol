import { describe, expect, it } from 'vitest';
import { assessFocalPulmonary, FOCAL_PULMONARY_LIMITS, type FocalPulmonaryAssessment, type FocalPulmonaryInput } from '../../plugin/lib/focal-pulmonary';

type Expected = Omit<FocalPulmonaryAssessment, 'conflict'>;

// alkor's respiratory-extraction-cases.json: evidence camelCased, nulls and not_stated left out,
// the case's measured temperature and SpO2 as inputs; the last column is alkor's conflict count.
const CASES: [string, FocalPulmonaryInput, Expected, number][] = [
  ["pu-01-right-base-classic", {"cough":"present","sputum":"purulent","reportedFever":"present","pleuriticPain":"present","symptomDurationDays":"4","examination":"performed","trachea":"central","right":{"percussion":"dull","breathSounds":"bronchial","addedSounds":"crackles","vocalResonance":"increased"},"left":{"percussion":"resonant","breathSounds":"vesicular","addedSounds":"none"},"imaging":[{"modality":"chest_radiograph","finding":"consolidation","result":"present","side":"right","timing":"current"},{"modality":"chest_radiograph","finding":"pleural_effusion","result":"absent","side":"not_stated","timing":"current"}],"temperatureC":"38.7","oxygenSaturation":"91"}, {"verdict":"supported","reason":"focal_imaging","focalSide":"right","pneumoniaEvidence":"imaging-supported","differential":["pneumonia"],"next":[]}, 0],
  ["pu-02-focal-crackles-asymptomatic", {"cough":"absent","sputum":"none","reportedFever":"absent","breathlessness":"absent","examination":"performed","right":{"percussion":"resonant","addedSounds":"none"},"left":{"percussion":"resonant","addedSounds":"crackles"},"temperatureC":"36.6","oxygenSaturation":"97"}, {"verdict":"indeterminate","reason":"focal_signs_without_symptoms","focalSide":"left","pneumoniaEvidence":"physical-sign-only","differential":[],"next":["chest_imaging"]}, 0],
  ["pu-03-suspected-no-film", {"cough":"present","sputum":"purulent","symptomDurationDays":"2","examination":"performed","right":{"addedSounds":"none"},"left":{"percussion":"dull","breathSounds":"reduced","addedSounds":"crackles"},"temperatureC":"38.2","oxygenSaturation":"93"}, {"verdict":"supported","reason":"focal_signs_with_symptoms","focalSide":"left","pneumoniaEvidence":"clinically-suspected","differential":["pneumonia"],"next":["chest_imaging"]}, 0],
  ["pu-04-film-no-exam", {"cough":"present","reportedFever":"absent","symptomDurationDays":"21","examination":"documented_not_performed","imaging":[{"modality":"chest_radiograph","finding":"consolidation","result":"present","side":"left","timing":"current"},{"modality":"chest_radiograph","finding":"pleural_effusion","result":"absent","side":"not_stated","timing":"current"}]}, {"verdict":"supported","reason":"focal_imaging","focalSide":"left","pneumoniaEvidence":"imaging-supported","differential":["pneumonia"],"next":["chest_examination","oxygen_saturation"]}, 0],
  ["pu-05-oedema-mimic", {"cough":"absent","sputum":"none","reportedFever":"absent","breathlessness":"present","symptomDurationDays":"3","examination":"performed","right":{"percussion":"stony_dull","addedSounds":"crackles"},"left":{"percussion":"stony_dull","addedSounds":"crackles"},"imaging":[{"modality":"chest_radiograph","finding":"pulmonary_oedema","result":"present","side":"bilateral","timing":"current"},{"modality":"chest_radiograph","finding":"pleural_effusion","result":"present","side":"bilateral","timing":"current"},{"modality":"chest_radiograph","finding":"consolidation","result":"absent","side":"not_stated","timing":"current"}],"temperatureC":"36.8","oxygenSaturation":"92"}, {"verdict":"unsupported","reason":"bilateral_findings","focalSide":"bilateral","pneumoniaEvidence":"none","differential":["pleural_effusion","pulmonary_oedema"],"next":[]}, 0],
  ["pu-06-postop-atelectasis", {"cough":"absent","examination":"performed","right":{"percussion":"resonant"},"left":{"percussion":"resonant","breathSounds":"reduced","addedSounds":"crackles_clearing_on_cough"},"imaging":[{"modality":"chest_radiograph","finding":"atelectasis","result":"present","side":"left","timing":"current"},{"modality":"chest_radiograph","finding":"consolidation","result":"absent","side":"not_stated","timing":"current"}],"temperatureC":"37.4","oxygenSaturation":"95"}, {"verdict":"supported","reason":"focal_imaging","focalSide":"left","pneumoniaEvidence":"none","differential":["atelectasis"],"next":["symptom_duration"]}, 0],
  ["pu-07-effusion", {"cough":"present","sputum":"none","reportedFever":"absent","breathlessness":"present","symptomDurationDays":"42","examination":"performed","trachea":"deviated_left","right":{"percussion":"stony_dull","breathSounds":"absent","vocalResonance":"reduced"},"left":{"addedSounds":"none"},"imaging":[{"modality":"chest_radiograph","finding":"pleural_effusion","result":"present","side":"right","timing":"current"}],"temperatureC":"36.9","oxygenSaturation":"94"}, {"verdict":"supported","reason":"focal_imaging","focalSide":"right","pneumoniaEvidence":"none","differential":["pleural_effusion"],"next":[]}, 0],
  ["pu-08-explicitly-normal-chest", {"cough":"present","sputum":"none","reportedFever":"present","pleuriticPain":"absent","breathlessness":"absent","symptomDurationDays":"3","examination":"performed","right":{"percussion":"resonant","breathSounds":"vesicular","addedSounds":"none","vocalResonance":"normal"},"left":{"percussion":"resonant","breathSounds":"vesicular","addedSounds":"none","vocalResonance":"normal"},"temperatureC":"37.9","oxygenSaturation":"99"}, {"verdict":"unsupported","reason":"no_focal_sign","focalSide":null,"pneumoniaEvidence":"none","differential":[],"next":[]}, 0],
  ["pu-09-silent", {"examination":"not_mentioned"}, {"verdict":"indeterminate","reason":"no_chest_evidence","focalSide":null,"pneumoniaEvidence":"none","differential":[],"next":[]}, 0],
  ["pu-10-contradictory", {"cough":"present","reportedFever":"present","symptomDurationDays":"5","examination":"performed","right":{"percussion":"resonant","addedSounds":"none"},"left":{"percussion":"resonant","addedSounds":"none"},"imaging":[{"modality":"chest_radiograph","finding":"consolidation","result":"present","side":"right","timing":"current"}],"temperatureC":"38.4","oxygenSaturation":"95"}, {"verdict":"supported","reason":"focal_imaging","focalSide":"right","pneumoniaEvidence":"imaging-supported","differential":["pneumonia"],"next":["re_examine_chest"]}, 1],
  ["pu-11-condensacion-es", {"cough":"present","sputum":"purulent","reportedFever":"present","pleuriticPain":"present","symptomDurationDays":"5","examination":"performed","right":{"percussion":"dull","breathSounds":"bronchial","addedSounds":"crackles"},"left":{"breathSounds":"vesicular"},"imaging":[{"modality":"chest_radiograph","finding":"consolidation","result":"present","side":"right","timing":"current"},{"modality":"chest_radiograph","finding":"pleural_effusion","result":"absent","side":"not_stated","timing":"current"}],"temperatureC":"38.5","oxygenSaturation":"90"}, {"verdict":"supported","reason":"focal_imaging","focalSide":"right","pneumoniaEvidence":"imaging-supported","differential":["pneumonia"],"next":[]}, 0],
  ["pu-12-history-and-question", {"cough":"absent","reportedFever":"absent","examination":"performed","right":{"percussion":"resonant","addedSounds":"wheeze"},"left":{"percussion":"resonant","addedSounds":"wheeze"},"imaging":[{"modality":"chest_radiograph","finding":"consolidation","result":"absent","side":"not_stated","timing":"historical"}],"temperatureC":"36.5","oxygenSaturation":"98"}, {"verdict":"unsupported","reason":"no_focal_sign","focalSide":null,"pneumoniaEvidence":"none","differential":[],"next":[]}, 0],
  ["pu-13-crackles-and-an-impression", {"cough":"absent","reportedFever":"absent","breathlessness":"absent","examination":"performed","right":{"percussion":"resonant","addedSounds":"crackles"},"left":{"percussion":"resonant","addedSounds":"none"},"temperatureC":"36.7","oxygenSaturation":"96"}, {"verdict":"indeterminate","reason":"focal_signs_without_symptoms","focalSide":"right","pneumoniaEvidence":"physical-sign-only","differential":[],"next":["chest_imaging"]}, 0],
];

describe('assessFocalPulmonary: alkor pu-* answer keys', () => {
  it.each(CASES)('%s', (_, input, expected, conflicts) => {
    const { conflict, ...rest } = assessFocalPulmonary(input);
    expect(rest).toEqual(expected);
    expect(conflict === null ? 0 : 1).toBe(conflicts);
  });

  it('covers all 13 pu-* cases', () => {
    expect(CASES.map(([name]) => name.slice(0, 5))).toEqual(Array.from({ length: 13 }, (_, i) => `pu-${String(i + 1).padStart(2, '0')}`));
  });
});

describe('assessFocalPulmonary', () => {
  const crackles: FocalPulmonaryInput = { examination: 'performed', right: { addedSounds: 'crackles' }, left: { addedSounds: 'none' } };

  it('pu-13: unilateral crackles without symptoms is indeterminate with no differential', () => {
    const r = assessFocalPulmonary(crackles);
    expect(r).toMatchObject({ verdict: 'indeterminate', pneumoniaEvidence: 'physical-sign-only', differential: [], next: ['chest_imaging'] });
  });

  it('a measured temperature at the fever line makes the same signs clinically suspected', () => {
    const at = String(FOCAL_PULMONARY_LIMITS.feverAtLeastC);
    expect(assessFocalPulmonary({ ...crackles, temperatureC: at })).toMatchObject({ verdict: 'supported', pneumoniaEvidence: 'clinically-suspected', differential: ['pneumonia'] });
    expect(assessFocalPulmonary({ ...crackles, temperatureC: '37.9' }).verdict).toBe('indeterminate');
  });

  it('a current film of no consolidation rules the examination down', () => {
    const r = assessFocalPulmonary({ ...crackles, cough: 'present', imaging: [{ modality: 'chest_radiograph', finding: 'consolidation', result: 'absent', side: 'not_stated', timing: 'current' }] });
    expect(r).toMatchObject({ verdict: 'supported', pneumoniaEvidence: 'none', differential: [] });
  });

  it('examination left out: the signs decide, and none recorded is no chest evidence', () => {
    const { examination: _, ...noFlag } = crackles;
    expect(assessFocalPulmonary(noFlag).reason).toBe('focal_signs_without_symptoms');
    expect(assessFocalPulmonary({}).reason).toBe('no_chest_evidence');
  });

  it('a film on the other side from the signs is a conflict, stated not resolved', () => {
    const r = assessFocalPulmonary({ ...crackles, imaging: [{ modality: 'ct_chest', finding: 'consolidation', result: 'present', side: 'left', timing: 'current' }] });
    expect(r.focalSide).toBe('left');
    expect(r.conflict).toEqual({ examinationSide: 'right', imagingSide: 'left', imagingFinding: 'consolidation' });
    expect(r.next).toContain('re_examine_chest');
  });
});
