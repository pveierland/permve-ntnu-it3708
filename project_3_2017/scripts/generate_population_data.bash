#!/usr/bin/env bash

set -e

image="../assignment/Test Image 128/3/Test image.jpg"
program="../program/segmentation --generations 250 --population 200 --tournament_group_size 10 --save true"
data_path="../data"

mkdir -p ${data_path}

eval ${program} --save_filename "${data_path}/population_edge_connectivity.txt" \
                --evaluate_overall_deviation false \
                --evaluate_edge_value true \
                --evaluate_connectivity_measure true \
                \"${image}\" &

eval ${program} --save_filename "${data_path}/population_deviation_connectivity.txt" \
                --evaluate_overall_deviation true \
                --evaluate_edge_value false \
                --evaluate_connectivity_measure true \
                \"${image}\" &

eval ${program} --save_filename "${data_path}/population_deviation_edge.txt" \
                --evaluate_overall_deviation true \
                --evaluate_edge_value true \
                --evaluate_connectivity_measure false \
                \"${image}\" &

eval ${program} --save_filename "${data_path}/population_deviation_edge_connectivity.txt" \
                --evaluate_overall_deviation true \
                --evaluate_edge_value true \
                --evaluate_connectivity_measure true \
                \"${image}\" &

wait
