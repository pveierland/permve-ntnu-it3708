#!/bin/bash

num_runs=8

for i in $(seq 1 $num_runs)
do
    output_file=lolz-adult-tournament-10-crossover-1.0-mutation-0.0001-population-300-L-40-Z-21-generations-500-run-${i}.txt
    ../program/lolz --adult_selection full --parent_selection sigma --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.0001 --population_size 300 --group_size 10 --generations 500 --Z 21 --L 40 > ../data/${output_file}
    echo ${output_file}
done

