#!/bin/bash

num_runs=5
population=300
generations=100

for mutation_rate in 0.0001 0.0005 0.001 0.005 0.01
do
    for i in $(seq 1 $num_runs)
    do
        output_file=onemax-adult-proportionate-crossover-1.0-mutation-${mutation_rate}-population-${population}-problem-40-generations-${generations}-run-${i}.txt
        ../program/onemax --adult_selection full --parent_selection proportionate --crossover_points 1 --crossover_rate 1.0 --mutation_rate ${mutation_rate} --population_size ${population} --problem_size 40 --generations ${generations} > ../data/${output_file}
        echo ${output_file}
    done
done

for crossover_rate in 0.6 0.8 1.0 0.98 0.95 0.92
do
    for i in $(seq 1 $num_runs)
    do
        output_file=onemax-adult-proportionate-crossover-${crossover_rate}-mutation-0.0001-population-${population}-problem-40-generations-${generations}-run-${i}.txt
        ../program/onemax --adult_selection full --parent_selection proportionate --crossover_points 1 --crossover_rate ${crossover_rate} --mutation_rate 0.0001 --population_size 150 --problem_size 40 --generations ${generations} > ../data/${output_file}
        echo ${output_file}
    done
done

for i in $(seq 1 $num_runs)
do
    output_file=onemax-adult-proportionate-crossover-1.0-mutation-0.0001-population-${population}-problem-40-generations-${generations}-run-${i}.txt
    ../program/onemax --adult_selection full --parent_selection proportionate --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.0001 --population_size ${population} --problem_size 40 --generations ${generations} > ../data/${output_file}
    echo ${output_file}
done

for i in $(seq 1 $num_runs)
do
    output_file=onemax-adult-rank-crossover-1.0-mutation-0.0001-population-${population}-problem-40-generations-${generations}-run-${i}.txt
    ../program/onemax --adult_selection full --parent_selection rank --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.0001 --population_size ${population} --problem_size 40 --generations ${generations} > ../data/${output_file}
    echo ${output_file}
done

for i in $(seq 1 $num_runs)
do
    output_file=onemax-adult-sigma-crossover-1.0-mutation-0.0001-population-${population}-problem-40-generations-${generations}-run-${i}.txt
    ../program/onemax --adult_selection full --parent_selection sigma --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.0001 --population_size ${population} --problem_size 40 --generations ${generations} > ../data/${output_file}
    echo ${output_file}
done

for group_size in 10 25 50
do
    for i in $(seq 1 $num_runs)
    do
        output_file=onemax-adult-tournament-group-${group_size}-crossover-1.0-mutation-0.0001-population-${population}-problem-40-generations-${generations}-run-${i}.txt
        ../program/onemax --adult_selection full --parent_selection tournament --group_size ${group_size} --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.0001 --population_size ${population} --problem_size 40 --generations ${generations} > ../data/${output_file}
        echo ${output_file}
    done
done

