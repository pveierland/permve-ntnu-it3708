#!/usr/bin/python3

import errno
import math
import numpy
import os
import pickle

from nsga2 import Nsga2

def convergence_metric(front):
    total_dist = 0

    for individual in front:
        lowest_dist = float('inf')

        for ndi in global_non_dominated_front:
            dist = (pow((individual[0] - ndi[0]) * distance_scaling, 2) +
                    pow((individual[1] - ndi[1]) * cost_scaling, 2))

            if dist < lowest_dist:
                lowest_dist = dist
            else:
                break

        total_dist += math.sqrt(lowest_dist)

    return total_dist / len(front)

def diversity_metric(front):
    df = math.sqrt(pow((front[0][0] - distance_min) * distance_scaling, 2) + pow((front[0][1] - cost_min) * cost_scaling, 2))
    dl = math.sqrt(pow((front[-1][0] - distance_min) * distance_scaling, 2) + pow((front[-1][1] - cost_min) * cost_scaling, 2))

    d = [0] * (len(front) - 1)

    for i in range(len(front) - 1):
        d[i] = math.sqrt(pow((front[i + 1][0] - front[i][0]) * distance_scaling, 2) + pow((front[i + 1][1] - front[i][1]) * cost_scaling, 2))

    d_average = sum(d) / len(d)

    return (df + dl + sum(abs(di - d_average) for di in d)) / (df + dl + len(d) * d_average)

parameter_runs = []

for f in os.listdir('generated/'):
    parameter_runs.append(pickle.load(open('generated/' + f, 'rb')))

global_non_dominated_front = []

population_size = len(list(
    True
    for parameter_run in parameter_runs
    for individual in parameter_run['population']
    if  individual['rank'] == 0))

print('population_size = {}'.format(population_size))

global_population = numpy.zeros((population_size, 3))

i = 0
for parameter_run in parameter_runs:
    for individual in parameter_run['population']:
        if individual['rank'] == 0:
            global_population[i, 0] = individual['distance']
            global_population[i, 1] = individual['cost']
            i += 1

for i in range(population_size):
    if (i + 1) % 100 == 0:
        print('{}/{}'.format(i + 1, population_size))

    p = global_population[i]

    if p[2]:
        continue

    for j in range(i, population_size):
        q = global_population[j]

        if (p[0] < q[0] and
            p[1] < q[1]):

            q[2] = 1

        elif (q[0] < p[0] and
              q[1] < p[1]):

            p[2] = 1
            break

    if p[2] == 0:
        global_non_dominated_front.append(p)

global_non_dominated_front.sort(key=lambda x: x[0])
distance_min = global_non_dominated_front[0][0]
distance_max = global_non_dominated_front[-1][0]
distance_scaling = 1 / (distance_max - distance_min)

global_non_dominated_front.sort(key=lambda x: x[1])
cost_min = global_non_dominated_front[0][1]
cost_max = global_non_dominated_front[-1][1]
cost_scaling = 1 / (cost_max - cost_min)

print('distance_min = {} distance_max = {}'.format(distance_min, distance_max))
print('cost_min = {} cost_max = {}'.format(cost_min, cost_max))

parameter_groups = {}

for parameter_run in parameter_runs:
    parameter_groups.setdefault(parameter_run['parameters'], []).append(parameter_run['population'])

try:
    os.makedirs('plots/')
except OSError as exception:
    if exception.errno != errno.EEXIST:
        raise

for population_size in [50, 100, 500, 1000]:
    for group_size in [0.05, 0.1, 0.2]:
        with open('plots/population-{}-generations-{}-group-{}'.format(
            population_size, 200, group_size), 'w') as f:

            for crossover_rate in [0, 0.2, 0.4, 0.6, 0.8, 1.0]:
                for mutation_rate in [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]:
                    parameters, runs = next((parameters, runs) for parameters, runs in parameter_groups.items()
                        if parameters == (population_size, 200, group_size, crossover_rate, mutation_rate))

                    diversity_total    = 0
                    convergence_total  = 0
                    distance_min_total = 0
                    cost_min_total     = 0

                    for run in runs:
                        ndf = [(individual['distance'], individual['cost']) for individual in run if individual['rank'] == 0]
                        diversity_total    += diversity_metric(ndf)
                        convergence_total  += convergence_metric(ndf)
                        distance_min_total += min(individual['distance'] for individual in run)
                        cost_min_total     += min(individual['cost'] for individual in run)

                    run_count = len(runs)

                    print('{} {} {} {} {} {}'.format(
                        crossover_rate,
                        mutation_rate,
                        diversity_total / run_count,
                        convergence_total / run_count,
                        distance_min_total / run_count,
                        cost_min_total / run_count), file=f)

                print('', file=f)
