#!/usr/bin/env bash

set -e

elitism_ratio=0.01
evolve=100
instance=7
tournament_randomness=0.1
program="../program/mdvrp.py --script --instance ${instance} --evolve ${evolve} --tournament_randomness ${tournament_randomness} --elitism_ratio ${elitism_ratio}"

for population_size in 50 100 200
do
    for tournament_group_size in 2 5 10 25
    do
        for crossover_rate in 0.6 0.8 1.0
        do
            for mutation_rate in 0.0 0.1 0.2
            do
                for run in {1..10}
                do
                    filename="../data/grid-search-result-instance-${instance}-evolve-${evolve}-population-${population_size}-tournament-group-${tournament_group_size}-tournament-randomness-${tournament_randomness}-crossover-${crossover_rate}-mutation-${mutation_rate}-run-${run}.txt"
                    cmd="${program} --population_size ${population_size} --tournament_group_size ${tournament_group_size} --crossover_rate ${crossover_rate} --mutation_rate ${mutation_rate}"
                    echo "${cmd}"
                    ${cmd} > ${filename} &
                done

                wait
            done
        done
    done
done