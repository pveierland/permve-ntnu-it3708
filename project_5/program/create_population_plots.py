#!/usr/bin/python3

import collections
import math
import numpy
import pickle
import sys

import matplotlib.pyplot as plt
from matplotlib import cm

def create_population_plot(marker, front_color, color, fronts, best_distance, worst_distance, best_cost, worst_cost):
    radii = 5

    best_distance_count  = 0
    best_cost_count      = 0
    worst_distance_count = 0
    worst_cost_count     = 0

    for i, front in enumerate(fronts):
        if front:
            count = collections.Counter((individual['distance'], individual['cost']) for individual in front)
            points, counts = zip(*count.items())
            x, y           = zip(*points)

            best_distance_count  = max(best_distance_count, count[(best_distance['distance'], best_distance['cost'])])
            best_cost_count      = max(best_cost_count, count[(best_cost['distance'], best_cost['cost'])])
            worst_distance_count = max(worst_distance_count, count[(worst_distance['distance'], worst_distance['cost'])])
            worst_cost_count     = max(worst_cost_count, count[(worst_cost['distance'], worst_cost['cost'])])

            sizes = [radii * count for count in counts]

            plt.scatter(x, y, marker=marker, s=counts, color=(front_color if i == 0 else color))
            plt.hold(True)

    if best_distance_count:
        plt.plot(best_distance['distance'],
                 best_distance['cost'],
                 marker, markeredgewidth=1, markeredgecolor=(front_color if best_distance_count == 1 else color), markerfacecolor='None',
                 markersize=math.sqrt(radii * best_distance_count) + 6)

    if best_cost_count:
        plt.plot(best_cost['distance'],
                 best_cost['cost'],
                 marker, markeredgewidth=1, markeredgecolor=(front_color if best_cost_count == 1 else color), markerfacecolor='None',
                 markersize=math.sqrt(radii * best_cost_count) + 6)

    if worst_distance_count:
        plt.plot(worst_distance['distance'],
                 worst_distance['cost'],
                 's', markeredgewidth=1, markeredgecolor=(front_color if worst_distance_count == 1 else color), markerfacecolor='None',
                 markersize=math.sqrt(radii * worst_distance_count) + 9)

    if worst_cost_count:
        plt.plot(worst_cost['distance'],
                 worst_cost['cost'],
                 's', markeredgewidth=1, markeredgecolor=(front_color if worst_cost_count == 1 else color), markerfacecolor='None',
                 markersize=math.sqrt(radii * worst_cost_count) + 9)

    plt.xlabel('Distance')
    plt.ylabel('Cost')

def safe_filename(filename):
    return filename.replace('.', '-')

parameter_runs = [(a, pickle.load(open(a, 'rb'))) for a in sys.argv[1:]]
total_entries  = []

markers = ['p', 'D', '*']
colors  = ['r', 'g', 'b']

for (filename, parameter_run), marker, color in zip(parameter_runs, markers, colors):
    parameter_run['best_distance'] = min(individual['distance'] for individual in parameter_run['population'])
    parameter_run['best_cost']     = min(individual['cost'] for individual in parameter_run['population'])

    plt.subplot(111)

    fronts = []

    i = 0
    while True:
        front = [individual for individual in parameter_run['population'] if individual['rank'] == i]
        if front:
            fronts.append(front)
            i += 1
        else:
            break

    best_distance  = min(parameter_run['population'], key=lambda x: x['distance'])
    worst_distance = max(parameter_run['population'], key=lambda x: x['distance'])
    best_cost      = min(parameter_run['population'], key=lambda x: x['cost'])
    worst_cost     = max(parameter_run['population'], key=lambda x: x['cost'])

    print('{} best_distance={} worst_distance={} best_cost={} worst_cost={} N={} ND={}'.format(
        parameter_run['parameters'],
        (best_distance['distance'], best_distance['cost']),
        (worst_distance['distance'], worst_distance['cost']),
        (best_cost['distance'], best_cost['cost']),
        (worst_cost['distance'], worst_cost['cost']),
        len(parameter_run['population']),
        len(fronts[0])))

    plt.hold(False)
    create_population_plot(marker, color, 'k', [fronts[0]], best_distance, worst_distance, best_cost, worst_cost)
    plt.savefig(safe_filename(filename) + '-front.pdf', format='PDF')
    plt.hold(False)
    create_population_plot(marker, 'r', 'k', fronts, best_distance, worst_distance, best_cost, worst_cost)
    plt.savefig(safe_filename(filename) + '-population.pdf', format='PDF')

    total_entries.append(([fronts[0]], best_distance, worst_distance, best_cost, worst_cost))

plt.hold(False)
for (fronts, best_distance, worst_distance, best_cost, worst_cost), marker, color in zip(total_entries, markers, colors):
    create_population_plot(marker, color, 'k', fronts, best_distance, worst_distance, best_cost, worst_cost)
plt.savefig('all-nd-fronts.pdf', format='PDF')
