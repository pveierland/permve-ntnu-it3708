#!/usr/bin/env bash

set -e

image="../assignment/Test Image 128/3/Test image.jpg"
program="../program/segmentation --generations 250 --population 200 --tournament_group_size 10 --save true"
data_path="../data"

mkdir -p ${data_path}
mkdir -p ${data_path}/edge_connectivity
mkdir -p ${data_path}/deviation_connectivity
mkdir -p ${data_path}/deviation_edge
mkdir -p ${data_path}/deviation_edge_connectivity

eval ${program} \"${image}\" \
    --save_filename "${data_path}/edge_connectivity/population.txt" \
    --evaluate_overall_deviation false \
    --evaluate_edge_value true \
    --evaluate_connectivity_measure true \
    --render_base_path "${data_path}/edge_connectivity/" \
    --hint 13 16 25 30 40 &

eval ${program} \"${image}\" \
    --save_filename "${data_path}/deviation_connectivity/population.txt" \
    --evaluate_overall_deviation true \
    --evaluate_edge_value false \
    --evaluate_connectivity_measure true \
    --render_base_path "${data_path}/deviation_connectivity/" \
    --hint 13 16 25 30 40 &

eval ${program} \"${image}\" \
    --save_filename "${data_path}/deviation_edge/population.txt" \
    --evaluate_overall_deviation true \
    --evaluate_edge_value true \
    --evaluate_connectivity_measure false \
    --render_base_path "${data_path}/deviation_edge/" \
    --hint 13 16 25 30 40 &

eval ${program} \"${image}\" \
    --save_filename "${data_path}/deviation_edge_connectivity/population.txt" \
    --evaluate_overall_deviation true \
    --evaluate_edge_value true \
    --evaluate_connectivity_measure true \
    --render_base_path "${data_path}/deviation_edge_connectivity/" \
    --hint 13 16 25 30 40 &

wait
