#!/usr/bin/python3

import pickle
import sys

parameter_runs = [(a, pickle.load(open(a, 'rb'))) for a in sys.argv[1:]]

for filename, parameter_run in parameter_runs:
    parameter_run['best_distance'] = min(individual['distance'] for individual in parameter_run['population'])
    parameter_run['best_cost']     = min(individual['cost'] for individual in parameter_run['population'])

distance_sorted = sorted(parameter_runs, key=lambda x: x[1]['best_distance'])
cost_sorted     = sorted(parameter_runs, key=lambda x: x[1]['best_cost'])

for i in range(0, 10):
    print('#{} \'{}\': {} {}'.format(
        i + 1,
        distance_sorted[i][0],
        distance_sorted[i][1]['best_distance'],
        distance_sorted[i][1]['parameters']))

print('')

for i in range(0, 10):
    print('#{} \'{}\': {} {}'.format(
        i + 1,
        cost_sorted[i][0],
        cost_sorted[i][1]['best_cost'],
        cost_sorted[i][1]['parameters']))
