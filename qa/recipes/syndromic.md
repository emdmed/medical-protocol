# Recipe: syndromic

QA for the bedside syndromic rules (volume, heart failure, chest examination, focal pulmonary, respiratory failure) and the extraction check that feeds them. Same split as `cli.md`: **expected verdicts are worked out by hand from the rule in each module's context doc** (`public/medical-protocol/context/{volume,heart-failure,chest-exam,focal-pulmonary,respiratory-failure,extraction}.md`), never copied from CLI output.

Run every command from the repo root as `node plugin/scripts/medprotocol.cjs <command>`. Made-up values only. Fixtures are in `qa/fixtures/syndromic/`.

## Cases
1. Volume: elevated JVP and bilateral rales → overload <!-- two majors -->
2. Volume: JVP 9 cmH2O, ankle oedema, hepatomegaly → overload <!-- 9 > 7 is a major; one major + two minors -->
3. Volume: JVP 7 cmH2O, rales present, every other sign absent → no overload <!-- 7 is not above 7: one major, nothing left to add -->
4. Volume: elevated JVP, every other sign absent but rales unassessed → indeterminate, rales named as the sign that would settle it <!-- one major; only rales can make two -->
5. Heart failure: breathlessness, bilateral crackles, elevated JVP → both sides congested, heart failure syndrome
6. Heart failure: clear chest, no S3, JVP 4 cm above the sternal angle → right-sided congestion <!-- 4 + 5 = 9 cmH2O > 7 -->
7. Heart failure: JVP 4 cm with no reference point → height not used, verdict indeterminate <!-- RA and sternal angle are 5 cm apart; neck otherwise unassessed -->
8. Heart failure: crackles at one base, no S3, JVP normal → no congestion <!-- one base is a clear chest -->
9. Heart failure: bilateral crackles, normal JVP, breathlessness and leg swelling both denied → left-sided, congestion without symptoms
10. Heart failure: neck not assessed, hepatojugular reflux positive, clear chest, no S3 → right-sided <!-- HJR route -->
11. Chest: right dull + bronchial → right consolidation; left resonant → no focal syndrome
12. Chest: trachea pulled left, left dull with absent breath sounds → left atelectasis; right not examined
13. Chest: right stony dull, trachea central → right pleural effusion
14. Chest: right hyperresonant with reduced breath sounds, trachea central → right pneumothorax
15. Chest: wheeze on both sides → bronchial obstruction pattern, no focal syndrome either side
16. Chest: crackles alone on the right → right indeterminate (never "pneumonia")
17. Chest: examination documented as not performed → both sides not examined, whatever signs are given
18. Focal pulmonary: cough, 38.4 °C, right dull + bronchial → supported (signs with symptoms), right, pneumonia clinically suspected
19. Focal pulmonary: left crackles + current left consolidation on film → supported (imaging), left, pneumonia imaging-supported
20. Focal pulmonary: right dull + bronchial, no history → indeterminate (signs without symptoms), pneumonia physical-sign only
21. Focal pulmonary: crackles on both sides with cough → not supported (bilateral), differential names pulmonary oedema
22. Focal pulmonary: exam right, film left → supported (imaging), focal side left, conflict stated, asks to re-examine
23. Focal pulmonary: examined, both sides resonant, cough → not supported (no focal sign)
24. Focal pulmonary: right consolidation signs with cough, current film shows no consolidation → pneumonia evidence none
25. Respiratory: room air, SpO2 86, RR 34, accessory muscles → failure (hypoxaemia) and distress
26. Respiratory: arterial pH 7.25, PaO2 55, PaCO2 60, HCO3 26 mmHg → failure, hypoxaemia and hypercapnia <!-- acute: HCO3 24 + 0.1 × 20 = 26, pH 7.40 − 0.08 × 2 = 7.24 -->
27. Respiratory: room air, SpO2 96, RR 18 → no failure, no distress
28. Respiratory: SpO2 95 on supplemental oxygen, no rate → failure indeterminate (adequate on support), distress not assessed
29. Respiratory: SpO2 95, nothing about oxygen → failure indeterminate (oxygen support not stated)
30. Respiratory: room air, arterial PaO2 8.0 kPa, PaCO2 5.3, pH 7.40, HCO3 24 → no failure <!-- 8.0 × 7.50062 = 60.0, at the line, not below -->
31. Respiratory: room air, SpO2 95, venous gas only → failure indeterminate (venous gas only), asks for an arterial gas
32. Respiratory: RR 32, no saturation → distress present, failure indeterminate (no oxygenation measure), asks for a saturation
33. Extraction: the fixture note's items get the right statuses, inputs and review
34. Extraction: the page written from the fixture shows each syndromic rule's hand-worked verdict, with denied findings listed apart
35. Extraction: a denied finding with a key, an unknown reading, or a missing episode is refused with a readable error

## Steps
1. (Case 1) Run `volume --jvp elevated --crackles present`. Expect: exit 0, "Volume overload".
2. (Case 2) Run `volume --jvp-cm 9 --edema present --hepatomegaly present`. Expect: exit 0, "Volume overload".
3. (Case 3) Run `volume --jvp-cm 7 --crackles present --s3 absent --hjr absent --edema absent --hepatomegaly absent --effusion absent`. Expect: exit 0, "No volume overload on examination".
4. (Case 4) Run `volume --jvp elevated --s3 absent --hjr absent --edema absent --hepatomegaly absent --effusion absent`. Expect: exit 0, "Indeterminate", and a "Would settle it" line naming rales and nothing else.
5. (Case 5) Run `heart-failure --breathlessness present --crackles bilateral --jvp elevated`. Expect: exit 0, "Left- and right-sided congestion", and the syndrome given as heart failure (a cardinal symptom present).
6. (Case 6) Run `heart-failure --crackles none --s3 absent --jvp-cm 4 --jvp-ref sternal-angle`. Expect: exit 0, "Right-sided congestion" with the jugular venous pressure as its sign; symptoms reported as not recorded.
7. (Case 7) Run `heart-failure --crackles none --s3 absent --jvp-cm 4`. Expect: exit 0, "Indeterminate"; the JVP height listed as not calculated / not used; a next step naming the neck or JVP.
8. (Case 8) Run `heart-failure --crackles unilateral --s3 absent --jvp normal_or_low`. Expect: exit 0, "No congestion on examination".
9. (Case 9) Run `heart-failure --breathlessness absent --leg-swelling absent --crackles bilateral --jvp normal_or_low`. Expect: exit 0, "Left-sided congestion", syndrome given as congestion without symptoms.
10. (Case 10) Run `heart-failure --hjr present --crackles none --s3 absent`. Expect: exit 0, "Right-sided congestion".
11. (Case 11) Run `chest --right-percussion dull --right-breath-sounds bronchial --left-percussion resonant`. Expect: exit 0, right "Consolidation", left "No focal syndrome".
12. (Case 12) Run `chest --trachea deviated_left --left-percussion dull --left-breath-sounds absent`. Expect: exit 0, left "Atelectasis", right "Not examined".
13. (Case 13) Run `chest --trachea central --right-percussion stony_dull`. Expect: exit 0, right "Pleural effusion".
14. (Case 14) Run `chest --trachea central --right-percussion hyperresonant --right-breath-sounds reduced`. Expect: exit 0, right "Pneumothorax".
15. (Case 15) Run `chest --right-added-sounds wheeze --left-added-sounds wheeze`. Expect: exit 0, a whole-chest bronchial obstruction pattern; both sides "No focal syndrome".
16. (Case 16) Run `chest --right-added-sounds crackles`. Expect: exit 0, right "Indeterminate" (crackles listed as unexplained); no verdict or reason line names pneumonia (the caveat note may).
17. (Case 17) Run `chest --examination documented_not_performed --right-percussion dull --right-breath-sounds bronchial`. Expect: exit 0, both sides "Not examined".
18. (Case 18) Run `pulmonary --cough present --temp 38.4 --right-percussion dull --right-breath-sounds bronchial`. Expect: exit 0, "Focal pulmonary syndrome supported", reason one-sided signs with symptoms or fever, focal side right, pneumonia evidence clinically suspected, differential includes pneumonia.
19. (Case 19) Run `pulmonary --left-added-sounds crackles --imaging chest_radiograph,consolidation,present,left,current`. Expect: exit 0, "Focal pulmonary syndrome supported", reason current imaging, focal side left, pneumonia evidence imaging-supported.
20. (Case 20) Run `pulmonary --right-percussion dull --right-breath-sounds bronchial`. Expect: exit 0, "Indeterminate", reason one-sided signs but no symptom, pneumonia evidence physical sign only.
21. (Case 21) Run `pulmonary --cough present --right-added-sounds crackles --left-added-sounds crackles`. Expect: exit 0, "Focal pulmonary syndrome not supported", reason findings on both sides, differential includes pulmonary oedema.
22. (Case 22) Run `pulmonary --cough present --right-percussion dull --right-breath-sounds bronchial --imaging chest_radiograph,consolidation,present,left,current`. Expect: exit 0, "Focal pulmonary syndrome supported", focal side left, a conflict naming the right-sided examination and the left-sided film, a next step to re-examine. No line choosing one over the other.
23. (Case 23) Run `pulmonary --examination performed --cough present --right-percussion resonant --left-percussion resonant`. Expect: exit 0, "Focal pulmonary syndrome not supported", reason chest examined and no focal sign.
24. (Case 24) Run `pulmonary --cough present --right-percussion dull --right-breath-sounds bronchial --imaging chest_radiograph,consolidation,absent,right,current`. Expect: exit 0, pneumonia evidence "None".
25. (Case 25) Run `respiratory-failure --oxygen-support room_air --spo2 86 --rr 34 --accessory-muscles present`. Expect: exit 0, "Respiratory failure" with hypoxaemia, "Respiratory distress" with the rate and accessory muscle use as its signs.
26. (Case 26) Run `respiratory-failure --blood-gas arterial --gas-unit mmHg --ph 7.25 --po2 55 --pco2 60 --hco3 26`. Expect: exit 0, "Respiratory failure", reason hypoxaemia and hypercapnia.
27. (Case 27) Run `respiratory-failure --oxygen-support room_air --spo2 96 --rr 18`. Expect: exit 0, "No respiratory failure" (adequate on room air), "No respiratory distress".
28. (Case 28) Run `respiratory-failure --oxygen-support supplemental_oxygen --spo2 95`. Expect: exit 0, "Failure indeterminate" (adequate on oxygen or ventilation), "Distress not assessed", next steps include a room-air saturation and a respiratory rate.
29. (Case 29) Run `respiratory-failure --spo2 95 --rr 18`. Expect: exit 0, "Failure indeterminate", reason nothing says what the patient was breathing.
30. (Case 30) Run `respiratory-failure --oxygen-support room_air --blood-gas arterial --gas-unit kPa --ph 7.40 --po2 8.0 --pco2 5.3 --hco3 24`. Expect: exit 0, "No respiratory failure"; PaO2 shown as 60 mmHg.
31. (Case 31) Run `respiratory-failure --oxygen-support room_air --spo2 95 --blood-gas venous --ph 7.36 --pco2 6.2 --hco3 26`. Expect: exit 0, "Failure indeterminate", reason only a venous gas, next steps include an arterial blood gas.
32. (Case 32) Run `respiratory-failure --rr 32`. Expect: exit 0, "Respiratory distress", "Failure indeterminate" (no saturation and no arterial PaO2), next steps include an oxygen saturation.
33. (Case 33) Run `extract --note qa/fixtures/syndromic/note.md --items qa/fixtures/syndromic/items.json --json`. Expect: exit 0, valid JSON, and:
    - status `quoted` for every item except: "Heart rate" `mismatched`, "Weight" `unverified`, "Age" `edited`.
    - `inputs` has exactly `rr` 32, `spo2` 88, `temp` 38.6, `creatinine` 1.9 (not 1.4, the history one). No `hr`, `weight`, `age`.
    - `review` has "Heart rate" and "Weight" as not-verified and "Age" as low-confidence; nothing for "Chest pain" or the history creatinine.
    - `exam` has cough, sputum, fever, oxygenSupport, accessoryMuscles, jvp, thirdHeartSound, trachea, rightPercussion, rightBreathSounds, leftPercussion, leftBreathSounds, each with the `reads` from the items file.
34. (Case 34) Make a fresh directory with `mktemp -d`, then run `extract --note qa/fixtures/syndromic/note.md --items qa/fixtures/syndromic/items.json --artifact <dir>/page.html`. Expect: exit 0, the file exists, and searching its text finds:
    - no "Shock" card (no blood pressure in the note);
    - "Volume overload" with result "Indeterminate" <!-- normal JVP and no S3: 0 majors; rales and HJR unassessed could still reach two -->;
    - "Heart failure" with result "Indeterminate" <!-- right absent on a normal JVP; left undecided, crackles never auscultated -->;
    - "Chest examination" with "Right: Consolidation" and "Left: No focal syndrome";
    - "Focal pulmonary syndrome" with "Focal pulmonary syndrome supported" and "Clinically suspected" <!-- right consolidation signs, cough, sputum, fever, 38.6 ≥ 38 -->;
    - "Respiratory failure and distress" with "Respiratory failure · Respiratory distress" <!-- SpO2 88 < 90 on room air; RR 32 ≥ 30, accessory muscles -->;
    - "JVP: not raised" and "Third heart sound: no S3" listed under "Absent", not under "Found".
35. (Case 35) Run `extract --note qa/fixtures/syndromic/note.md --items qa/fixtures/syndromic/items-absent-key.json`, then the same with `items-bad-reads.json`, then with `items-no-episode.json`. Expect for each: exit 1, one short error (an absent finding takes no key; exam and reads go together, listing the readings; needs episode "current" or "history"), no line starting with `    at `.
