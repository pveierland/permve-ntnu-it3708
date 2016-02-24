#!/bin/bash

# 30 seconds
# 820 in 90 seconds
#../program/surprising --adult_selection mixed --parent_selection tournament --group_size 25 --crossover_points 5 --mutation_rate 0.005 --population_size 500 --child_count 400 --S 32 --local --L 820 --generations 10000 --stop

# 92 in < 60 seconds
# 95 in < 60 seconds
#../program/surprising --adult_selection mixed --parent_selection tournament --group_size 25 --crossover_points 5 --mutation_rate 0.005 --population_size 500 --child_count 400 --S 37 --global --L 95 --generations 10000 --stop

# 100 in 120 seconds
../program/surprising --adult_selection over --parent_selection tournament --group_size 25 --crossover_points 10 --mutation_rate 0.007 --population_size 500 --child_count 600 --S 37 --global --L 100 --generations 10000 --stop

