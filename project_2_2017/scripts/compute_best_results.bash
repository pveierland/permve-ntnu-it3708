#!/usr/bin/env bash

set -e

crossover_randomness=0.1
elitism_ratio=0.01
evolve=100
mutation_randomness=0.1
tournament_randomness=0.1
program="../program/mdvrp.py --script --crossover_randomness ${crossover_randomness} --elitism_ratio ${elitism_ratio} --evolve ${evolve} --mutation_randomness ${mutation_randomness} --tournament_randomness ${tournament_randomness}"

population_size=200
tournament_group_size=10
crossover_rate=0.8
mutation_rate=0.2

for instance in `ls -1 ../assignment/data/instances`
do
    cmd="${program} --instance ${instance} --population_size ${population_size} --tournament_group_size ${tournament_group_size} --crossover_rate ${crossover_rate} --mutation_rate ${mutation_rate}"
    echo "${cmd}"
    ${cmd} &
done

wait
