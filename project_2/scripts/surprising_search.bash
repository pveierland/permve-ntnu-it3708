#!/bin/bash

#../program/surprising --adult_selection full --parent_selection tournament --group_size 8 --crossover_points 1 --mutation_rate 0.001 --population_size 200 --child_count 200 --S 20 --local --L 390 --generations 10000 --stop

# 800 in 30 seconds
# 820 in 90 seconds
#../program/surprising --adult_selection mixed --parent_selection tournament --group_size 25 --crossover_points 5 --mutation_rate 0.005 --population_size 500 --child_count 400 --S 32 --local --L 800 --generations 10000 --stop

# 92 in < 60 seconds
# 95 in < 60 seconds
../program/surprising --adult_selection over --parent_selection tournament --group_size 25 --epsilon 0.2 --crossover_points 5 --mutation_rate 0.008 --population_size 500 --child_count 600 --S 37 --global --L 90 --generations 10000 --stop

#../program/surprising --adult_selection over --parent_selection tournament --group_size 50 --mutation_rate 0.008 --population_size 500 --child_count 600 --S 37 --global --L 90 --generations 10000 --stop

#../program/surprising --adult_selection over --parent_selection sigma --group_size 50 --mutation_rate 0.008 --population_size 500 --child_count 600 --S 37 --global --L 90 --generations 10000 --stop
