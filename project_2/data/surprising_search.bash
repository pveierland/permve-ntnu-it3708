#!/bin/bash

# 30 seconds
../program/surprising --adult_selection mixed --parent_selection tournament --group_size 25 --crossover_points 5 --mutation_rate 0.005 --population_size 500 --child_count 400 --S 32 --local --L 800 --generations 10000

#../program/surprising --adult_selection mixed --parent_selection tournament --group_size 25 --crossover_points 5 --mutation_rate 0.005 --population_size 500 --child_count 400 --S 37 --global --L 90 --generations 10000

