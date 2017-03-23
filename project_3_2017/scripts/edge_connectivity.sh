#!/usr/bin/env bash

program="../../program/segmentation --generations 250 --population 200 --tournament_group_size 10 --save true"
name="edge_connectivity"

rm -rf "${name}"
mkdir -p "${name}"
cp "$1" "${name}/"
cd "${name}"

filename=$(basename "$1")
mv "${filename}" "input.jpg"
shift

convert -resize 128x128^ "input.jpg" "input.jpg"

eval ${program} "input.jpg" \
    --save_filename "population.txt" \
    --evaluate_overall_deviation false \
    --evaluate_edge_value true \
    --evaluate_connectivity_measure true \
    --hint "$@"

cp "../../report/demo_${name}.tex" .

latexmk -f -pdf -interaction=nonstopmode -synctex=1 -latexoption=--shell-escape "demo_${name}.tex" > /dev/null 2>&1
