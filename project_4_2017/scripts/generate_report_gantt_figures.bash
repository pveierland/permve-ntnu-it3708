#!/usr/bin/env bash

instance="3"
problem_file="../assignment/Test Data/${instance}.txt"
program="../program/program.py --problem \"${problem_file}\""

target_path="../report/figures"
mkdir -p "${target_path}"

for optimizer in aco ba pso
do
    eval "${program} --optimizer ${optimizer} --render --render_output_filename \"${target_path}/solution_${optimizer}_instance_${instance}.pdf\" --pickle --pickle_output_filename \"${target_path}/solution_${optimizer}_instance_${instance}.pickle\""
done