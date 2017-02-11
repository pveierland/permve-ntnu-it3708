import math
import numpy as np
import random

class ExchangeMutation(object):
    def __init__(self, mutation_rate):
        self.mutation_rate = mutation_rate

    def __call__(self, sequence):
        if random.random() < self.mutation_rate:
            sequence_length = len(sequence)
            first           = random.randrange(sequence_length)
            second          = random.randrange(sequence_length)
            sequence[first], sequence[second] = sequence[second], sequence[first]
        return sequence

class OrderedCrossover(object):
    def __call__(self, parent_sequence_a, parent_sequence_b):
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

class SequenceCreator(object):
    def __init__(self, length):
        self.length = length

    def __call__(self):
        sequence = list(range(self.length))
        random.shuffle(sequence)
        return sequence

def diversity(population):
    population_size = len(population)
    sequence_length = len(population[0].genotype)

    counts = np.zeros((sequence_length, sequence_length))

    for individual in population:
        for index, gene in enumerate(individual.genotype):
            counts[index, gene] += 1

    diversity = 0.0

    for index in range(sequence_length):
        for character in range(sequence_length):
            frequency  = counts[index, character] / population_size
            if frequency != 0 and frequency != 1:
                diversity -= frequency * math.log(frequency) + (1 - frequency) * math.log(1 - frequency)

    return diversity