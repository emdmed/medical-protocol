#!/usr/bin/env bash
# Runs the same commands on two builds of the CLI and reports every difference in stdout, stderr,
# exit code or written files. For refactors that must not change what the CLI prints.
# Usage: bash scripts/compare-cli.sh <base>
#   <base>  git ref whose committed build is the reference, or a path to a saved medprotocol.cjs
set -u

base=${1:?Usage: bash scripts/compare-cli.sh <git ref | path to medprotocol.cjs>}
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Each build gets its own folder with the same fixtures: commands that write files start equal.
for side in old new; do
  mkdir -p "$tmp/$side/work/queue" "$tmp/$side/out"
  cd "$tmp/$side/work"
  printf 'Made-up patient. BP 118/76, HR 72.\n' > note.txt
  printf '[{"field":"Heart rate","value":"72","quote":"HR 72","episode":"current","key":"hr"}]\n' > items.json
  printf '{"a":1}\n' > bad.json
  printf '{"action":"audit","selector":"#bmi","tag":"div","text":"BMI","ts":"2026-01-01T00:00:00Z"}\n' > queue/1.json
  printf '{"action":"add","prompt":"a made-up card","selector":"main","ts":"2026-01-01T00:00:01Z","status":"done"}\n' > queue/2.json
  cd - > /dev/null
done
if [ -f "$base" ]; then
  cp "$base" "$tmp/old/medprotocol.cjs"
else
  git show "$base:plugin/scripts/medprotocol.cjs" > "$tmp/old/medprotocol.cjs" || exit 2
fi
cp plugin/scripts/medprotocol.cjs "$tmp/new/medprotocol.cjs"

# One line per place that parses flags: "<command>|<valid flags>".
sites='bmi|--weight 70 --height-m 1.75 --metric
abg|--ph 7.25 --pco2 29 --hco3 14 --na 140 --cl 105 --albumin 4.0
water-balance|--weight 70 --oral 1500 --iv 500 --diuresis 1200 --stools 2
vitals|--bp 150/95 --hr 110 --rr 22 --temp 101.2 --fahrenheit --spo2 92 --fio2 40
pafi|--pao2 60 --fio2 40
dka|--glucose 350 --prev-glucose 460 --hours 2 --ketones 3.0 --bicarbonate 12 --ph 7.20 --unit mgdl
cardiology ascvd|--age 55 --sex male --tc 213 --hdl 50 --sbp 120 --smoker
cardiology heart|--history 1 --ecg 1 --age 2 --risk-factors 1 --troponin 0
cardiology chadsvasc|--age65 --female --hypertension
sepsis sofa|--pao2 60 --fio2 80 --advanced-support --platelets 40 --gcs 13 --creatinine 2.5 --infection --lactate 4
sepsis qsofa|--rr 24 --sbp 90 --gcs 13
sepsis lactate|--initial 4.2 --repeat 2.1
ckd egfr|--creatinine 1.2 --age 55 --sex male
ckd stage|--creatinine 1.2 --age 55 --sex male --acr 45
ckd kfre|--age 65 --sex female --egfr 35 --acr 300
ckd treatment|--egfr 35 --acr 300 --diabetes
ckd anemia|--hb 9.5 --sex male --ferritin 80 --tsat 15
ckd mbd|--phosphate 5.2 --calcium 8.5 --albumin 3.2 --pth 250 --vitamin-d 18 --gfr-category G4
diabetes diagnose|--a1c 6.8 --fpg 130
diabetes t1d-stage|--autoantibodies 3 --a1c 5.9
diabetes t1-vs-t2|--age 25 --bmi 22 --autoantibodies --c-peptide 150 --fhx-t1d --dka-history
diabetes t2d-screen|--age 40 --bmi 28 --hypertension
diabetes gdm|--strategy one-step --fasting 95 --1h 185 --2h 160
extract|--note note.txt --items items.json
overlay|--list --dir queue'

# Every site: plain, JSON (flag last and first), help, an unknown flag, no flags at all.
commands=$(while IFS='|' read -r site flags; do
  printf '%s\n' "$site $flags" "$site $flags --json" "$site --json $flags" "$site --help" "$site --nope" "$site"
done <<< "$sites")

# Routing, errors, and the commands that write files (order matters for those).
commands+='

--help
-h
--version
nope
ckd
ckd -h
ckd nope
ckd toString
bmi --weight 154 --height-ft 5 --height-in 9
bmi --weight 70 --metric
bmi --weight abc --height-m 1.75 --metric
pafi --pao2 0 --fio2 40
abg --ph 7.34 --pco2 60 --hco3 31
vitals --bp 118/76 --hr 72 --temp 37.0
vitals --bp 190/125 --spo2 84
vitals --bp abc
vitals --hr 999
dka --glucose 22 --prev-glucose 25 --hours 1 --unit mmol
cardiology ascvd --age 55 --sex female --race aa --tc 213 --hdl 50 --sbp 140 --bp-treatment --diabetes
cardiology heart --history 9 --ecg 0 --age 0 --risk-factors 0 --troponin 0
sepsis sofa --spo2 90 --fio2 21 --map 60 --norepinephrine 0.2 --bilirubin 3 --urine-output 400 --weight 70 --rrt --baseline 2
ckd egfr --creatinine 0 --age 55 --sex male
ckd egfr --creatinine 1.2 --age 55 --sex other
ckd treatment --egfr 35 --acr 300 --diabetes --heart-failure --on-rasi --potassium-normal
ckd mbd --gfr-category G9
diabetes diagnose --random-pg 250 --symptoms
diabetes t1d-stage --autoantibodies 2 --fpg 130 --2h-pg 210 --symptoms
diabetes t1-vs-t2 --age 55 --bmi 32 --c-peptide 700 --fhx-t2d
diabetes t1-vs-t2 --age 25 --bmi 22 --on-insulin
diabetes t2d-screen --age 30 --bmi 22
diabetes gdm --strategy two-step --fasting 96 --1h 185 --2h 160 --3h 145
diabetes gdm --strategy nope --fasting 96 --1h 185 --2h 160
extract --note note.txt --items bad.json
extract --note missing.txt --items items.json
extract --save note.txt
extract --save note.txt
extract --save note.txt --json
extract --note note.txt --items items.json --artifact page.html
extract --serve --port abc
overlay --list --dir queue --action implement
overlay --drain --dir queue --json
overlay --drain --dir queue
overlay --clear --dir queue
overlay --clear --dir queue --json
overlay --serve --port 0'

count=0
differ=0
while IFS= read -r args; do
  count=$((count + 1))
  for side in old new; do
    # $args is split on purpose: no command here has a space inside a value.
    (cd "$tmp/$side/work" && timeout 20 node ../medprotocol.cjs $args < /dev/null > "../out/$count.stdout" 2> "../out/$count.stderr"
      echo "exit code $?" > "../out/$count.exit")
    # The two builds sit in different folders; hide that from the comparison.
    sed -i "s#$tmp/$side#<tmp>#g" "$tmp/$side/out/$count".*
  done
  for part in stdout stderr exit; do
    if ! diff "$tmp/old/out/$count.$part" "$tmp/new/out/$count.$part" > "$tmp/diff"; then
      differ=$((differ + 1))
      echo "DIFFERENT $part: medprotocol $args"
      sed 's/^/    /' "$tmp/diff"
    fi
  done
done <<< "$commands"

if ! diff -r "$tmp/old/work" "$tmp/new/work" > "$tmp/diff"; then
  differ=$((differ + 1))
  echo "DIFFERENT files written:"
  sed "s#$tmp/##g; s/^/    /" "$tmp/diff"
fi

echo "$count commands compared, $differ differences"
[ "$differ" -eq 0 ]
