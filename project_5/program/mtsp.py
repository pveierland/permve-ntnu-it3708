import numpy
import random
import sys

from nsga2 import Nsga2

class Mtsp(object):
    @staticmethod
    def crossover_sequence_ox(parent_sequence_a, parent_sequence_b):
        sequence_length  = len(parent_sequence_a)
        child_sequence_a = [None] * sequence_length
        child_sequence_b = [None] * sequence_length

        first  = random.randrange(sequence_length)
        second = random.randrange(sequence_length)

        left, right = min(first, second), max(first, second)

        for m in range(left, right + 1):
            child_sequence_a[m] = parent_sequence_a[m]
            child_sequence_b[m] = parent_sequence_b[m]

        m   = (right + 1) % sequence_length
        n_a = m
        n_b = m

        while m != left:
            while parent_sequence_a[n_a] in child_sequence_b:
                n_a = (n_a + 1) % sequence_length

            while parent_sequence_b[n_b] in child_sequence_a:
                n_b = (n_b + 1) % sequence_length

            child_sequence_b[m] = parent_sequence_a[n_a]
            child_sequence_a[m] = parent_sequence_b[n_b]

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

    @classmethod
    def build(cls, distance_filename, cost_filename):
        return cls(Mtsp.read_matrix_file(distance_filename),
                   Mtsp.read_matrix_file(cost_filename))

    def __init__(self, distances, costs):
        self.distances  = distances
        self.costs      = costs
        self.num_cities = self.distances.shape[0]

    def evaluate_objectives(self, sequence):
        distance = 0
        cost     = 0

        from_city_id = sequence[0]
        for to_city_id in sequence[1:]:
            distance     += self.distances[from_city_id, to_city_id]
            cost         += self.costs[from_city_id, to_city_id]
            from_city_id  = to_city_id

        distance += self.distances[from_city_id, sequence[0]]
        cost     += self.costs[from_city_id, sequence[0]]

        return (distance, cost)

    def generate_sequence(self):
        sequence = list(range(self.num_cities))
        random.shuffle(sequence)
        return sequence

    def initialize(self, options):
        self.nsga2 = Nsga2(
            options=options,
            genotype_creator=self.generate_sequence,
            objective_evaluator=self.evaluate_objectives,
            crossover_operator=Mtsp.crossover_sequence_ox,
            mutation_operator=Mtsp.mutate_sequence)
