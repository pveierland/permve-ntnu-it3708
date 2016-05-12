#!/usr/bin/python3

import argparse

from mtsp import Mtsp
from nsga2 import Nsga2

parser = argparse.ArgumentParser()
parser.add_argument('--generations', type=int, default=100)
parser.add_argument('--crossover_rate', type=float, default=1)
parser.add_argument('--mutation_rate', type=float, default=0.01)
parser.add_argument('--population', type=int, default=100)
parser.add_argument('--tournament_group_size', type=int, default=10)
parser.add_argument('--tournament_randomness', type=float, default=0.1)
args = parser.parse_args()

print(args)

mtsp = Mtsp.build('../data/distance.csv', '../data/cost.csv')

mtsp.initialize({
    'objective_count':       2,
    'population_size':       args.population,
    'generation_count':      args.generations,
    'crossover_rate':        args.crossover_rate,
    'mutation_rate':         args.mutation_rate,
    'tournament_group_size': args.tournament_group_size,
    'tournament_randomness': args.tournament_randomness
})

for _ in range(args.generations):
    mtsp.nsga2.evolve()
    print('generation: {} distance: {} cost: {}'.format(
        mtsp.nsga2.generation,
        mtsp.nsga2.extreme_min[0].objective_values[0],
        mtsp.nsga2.extreme_min[1].objective_values[1]))
