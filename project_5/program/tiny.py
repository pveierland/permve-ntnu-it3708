#!/usr/bin/python3
import numpy

import argparse
import collections
import functools
import math
import operator
import random
import sys
import time

from nsga2 import Nsga2

class Mtsp(object):
    @staticmethod
    def crossover_sequence_ox(parent_sequence_a, parent_sequence_b):
        sequence_length  = len(parent_sequence_a)
        child_sequence_a = [None] * sequence_length
        child_sequence_b = [None] * sequence_length

        left, right = sorted(random.sample(range(sequence_length + 1), 2))

        for m in range(left, right):
            child_sequence_a[m] = parent_sequence_a[m]
            child_sequence_b[m] = parent_sequence_b[m]

        m   = right % sequence_length
        n_a = m
        n_b = m

        while m != left:
            while n_a != sequence_length:
                if parent_sequence_a[n_a] not in child_sequence_b:
                    child_sequence_b[m] = parent_sequence_a[n_a]
                    break
                n_a = (n_a + 1) % sequence_length

            while True:
                if parent_sequence_b[n_b] not in child_sequence_a:
                    child_sequence_a[m] = parent_sequence_b[n_b]
                    break
                n_b = (n_b + 1) % sequence_length

            m = (m + 1) % sequence_length

        return child_sequence_a, child_sequence_b

    @staticmethod
    def mutate_sequence(sequence):
        length = len(sequence)
        a = random.randrange(length)
        b = random.randrange(length)
        sequence[a], sequence[b] = sequence[b], sequence[a]

    @staticmethod
    def read_matrix_file(filename):
        with open(filename) as matrix_file:
            num_cities = len(matrix_file.readline().split(',')) - 1
            values = numpy.zeros((num_cities, num_cities))

            for i in range(num_cities):
                row = list(float(value) for value in matrix_file.readline().split(',')[1:] if value.strip())
                values[i,:len(row)] = row
                values[:len(row),i] = row

            return values

    def __init__(self, distance_filename, cost_filename):
        self.distances  = Mtsp.read_matrix_file(distance_filename)
        self.costs      = Mtsp.read_matrix_file(cost_filename)
        self.num_cities = self.distances.shape[0]

    def evaluate_objectives(self, sequence):
        distance = 0
        cost     = 0

        from_city_id = 0
        for to_city_id in sequence:
            distance     += self.distances[from_city_id, to_city_id]
            cost         += self.costs[from_city_id, to_city_id]
            from_city_id  = to_city_id

        distance += self.distances[from_city_id, 0]
        cost     += self.costs[from_city_id, 0]

        return (distance, cost)

    def generate_sequence(self):
        sequence = list(range(1, self.num_cities))
        random.shuffle(sequence)
        return sequence

    def initialize(self, options):
        self.nsga2 = Nsga2(
            options=options,
            genotype_creator=self.generate_sequence,
            objective_evaluator=self.evaluate_objectives,
            crossover_operator=Mtsp.crossover_sequence_ox,
            mutation_operator=Mtsp.mutate_sequence)

parser = argparse.ArgumentParser()
parser.add_argument('--generations', type=int)
parser.add_argument('--crossover_rate', type=float)
parser.add_argument('--mutation_rate', type=float)
parser.add_argument('--population', type=int)
parser.add_argument('--tournament_group_size', type=int)
parser.add_argument('--tournament_randomness', type=float)
parser.add_argument('--nogui', action='store_true')
args = parser.parse_args()

print(args)

mtsp = Mtsp('../data/distance.csv', '../data/cost.csv')

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
