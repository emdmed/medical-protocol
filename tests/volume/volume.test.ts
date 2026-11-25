import { describe, it, expect } from 'vitest';
import { assessVolume, type VolumeExam, type VolumeReason, type VolumeStatus } from '../../plugin/lib/volume';

// medextract packs/clinical/exams/vo-*.exam.json, expected verdicts from evals/volume-cases.json
// (vo-13, vo-14, vo-21 from volume-extraction-cases.json; their payloads are vo-06's).
const CASES: [string, VolumeExam, VolumeStatus, VolumeReason | null][] = [
  ['vo-01-classic-congestion', { jvp: 'elevated', rales: 'present', s3Gallop: 'present', hepatojugularReflux: 'present', bilateralAnkleEdema: 'present', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'overload', null],
  ['vo-02-two-majors', { jvp: 'elevated', rales: 'present', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'overload', null],
  ['vo-02b-two-majors-s3-hjr', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'present', hepatojugularReflux: 'present', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'overload', null],
  ['vo-03-one-major-two-minors', { jvp: 'elevated', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'present', hepatomegaly: 'present', pleuralEffusion: 'absent' }, 'overload', null],
  ['vo-04-one-major-one-minor', { jvp: 'elevated', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'present', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-05-minors-only', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'present', hepatomegaly: 'present', pleuralEffusion: 'present' }, 'no_overload', null],
  ['vo-05b-cannot-reach', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-06-euvolemic', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-07-jvp-at-threshold', { jvp: 'not_assessed', jvpCmH2O: '7', rales: 'present', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-08-jvp-above-threshold', { jvp: 'not_assessed', jvpCmH2O: '8', rales: 'present', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'overload', null],
  ['vo-09-gaps-dont-remove-a-positive', { jvp: 'elevated', rales: 'present', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'overload', null],
  ['vo-10-incomplete-exclusion', { jvp: 'elevated', rales: 'not_assessed', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-11-no-exam-documented', { jvp: 'not_assessed', rales: 'not_assessed', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'no_exam_documented'],
  ['vo-12-one-minor-rest-unassessed', { jvp: 'not_assessed', rales: 'not_assessed', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'present', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-13-unilateral-edema', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-14-unilateral-crackles', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-15-two-minors-major-unassessed', { jvp: 'not_assessed', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'present', hepatomegaly: 'present', pleuralEffusion: 'absent' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-16-effusion-signs-only', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'present' }, 'no_overload', null],
  ['vo-16b-edema-chronic-venous', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'present', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
  ['vo-17-cxr-and-bnp', { jvp: 'not_assessed', rales: 'absent', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'absent', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-18-echo-report', { jvp: 'not_assessed', rales: 'absent', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'absent', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-19-history-not-exam', { jvp: 'not_assessed', rales: 'present', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-20-one-negative-major-rest-unassessed', { jvp: 'not_assessed', rales: 'absent', s3Gallop: 'not_assessed', hepatojugularReflux: 'not_assessed', bilateralAnkleEdema: 'not_assessed', hepatomegaly: 'not_assessed', pleuralEffusion: 'not_assessed' }, 'indeterminate', 'unassessed_findings_could_change_verdict'],
  ['vo-21-previous-admission', { jvp: 'normal_or_low', rales: 'absent', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' }, 'no_overload', null],
];

describe('assessVolume: alkor vo-* answer keys', () => {
  it.each(CASES)('%s', (_, exam, status, reason) => {
    expect(assessVolume(exam)).toMatchObject({ status, reason });
  });
});

describe('assessVolume', () => {
  it('names the neck as pivotal when two minors are documented and the JVP is not (vo-15)', () => {
    const exam = CASES.find(([name]) => name.startsWith('vo-15'))![1];
    expect(assessVolume(exam)?.pivotal).toEqual(['jvp']);
  });

  it('has nothing pivotal on a decided verdict or a wide-open exam', () => {
    expect(assessVolume({ jvp: 'elevated', rales: 'present' })?.pivotal).toEqual([]);
    expect(assessVolume({})?.pivotal).toEqual([]);
  });

  it('the examiner impression wins over a measured height', () => {
    expect(assessVolume({ jvp: 'normal_or_low', jvpCmH2O: '12', rales: 'present', s3Gallop: 'absent', hepatojugularReflux: 'absent', bilateralAnkleEdema: 'absent', hepatomegaly: 'absent', pleuralEffusion: 'absent' })?.status).toBe('no_overload');
  });

  it('returns null for an unusable measured JVP', () => {
    expect(assessVolume({ jvpCmH2O: 'abc' })).toBeNull();
    expect(assessVolume({ jvpCmH2O: '-1' })).toBeNull();
  });
});
