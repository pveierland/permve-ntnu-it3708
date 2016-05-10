#!/usr/bin/python3

import itertools
import multiprocessing
import os
import pickle

from mtsp import Mtsp

def run_mtsp(distances, costs, parameters, run):
    population_size, generation_count, group_size, crossover_rate, mutation_rate = parameters

    filename = 'population-{}-generations-{}-group-{}-crossover-{}-mutation-{}-run-{}'.format(
        population_size, generation_count, group_size, crossover_rate, mutation_rate, run)

    if os.path.isfile('generated/' + filename):
        return

    mtsp = Mtsp(distances, costs)

    mtsp.initialize({
        'objective_count':       2,
        'population_size':       population_size,
        'generation_count':      generation_count,
        'crossover_rate':        crossover_rate,
        'mutation_rate':         mutation_rate,
        'tournament_group_size': int(round(population_size * group_size)),
        'tournament_randomness': 0.1
    })

    for _ in range(generation_count):
        mtsp.nsga2.evolve()

    individuals = []
    for individual in mtsp.nsga2.population:
        individuals.append({
            'sequence': individual.genotype,
            'rank':     individual.rank,
            'distance': individual.objective_values[0],
            'cost':     individual.objective_values[1]
        })

    pickle.dump({
        'parameters': parameters,
        'population': individuals
    }, open('generated/' + filename, 'wb'))

    return 'distance: {} cost: {}'.format(
        mtsp.nsga2.extreme_min[0].objective_values[0],
        mtsp.nsga2.extreme_min[1].objective_values[1])

if __name__ == '__main__':
    distances = Mtsp.read_matrix_file('../data/distance.csv')
    costs     = Mtsp.read_matrix_file('../data/cost.csv')

    runs = 5

    population_sizes  = [50, 100, 500, 1000]
    generation_counts = [100]
    group_sizes       = [0.05, 0.1, 0.2]
    crossover_rates   = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
    mutation_rates    = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]

    parameter_sets = (population_sizes, generation_counts, group_sizes, crossover_rates, mutation_rates)

    pool  = multiprocessing.Pool()
    tasks = []

    tasks = [(distances, costs, parameters, run)
             for parameters in itertools.product(*parameter_sets)
             for run in range(1, runs + 1)]

    results = [pool.apply_async(run_mtsp, task) for task in tasks]

    for i, result in enumerate(results):
        description = result.get()
        print('{}/{} {}'.format(i + 1, len(results), description))

    pool.close()
    pool.join()
