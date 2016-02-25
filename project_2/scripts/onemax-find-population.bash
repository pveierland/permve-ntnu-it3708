#!/bin/bash

num_successful=0
num_runs=100

for i in $(seq 1 $num_runs)
do
    ../program/onemax --adult_selection full --parent_selection proportionate --crossover_points 1 --crossover_rate 1.0 --mutation_rate 0.001 --population_size 300 --problem_size 40 --generations 100

    if [ $? -eq 1 ]
    then
        ((++num_successful))
    fi
done

# population mutation_rate crossover_points result
# 100        0.01          5                2/100
# 100        0.001         5                43/100
# 100        0.005         5                24/100
# 100        0.0005        5                46/100
# 100        0.0001        5                39/100
# 200        0.001         5                99/100
# 250        0.001         5                100/100

echo "$num_successful/$num_runs"

