import itertools
import random

from BitVector import BitVector

class Creator(object):
    def __init__(self, length, value_distribution):
        self.length             = length
        self.value_distribution = value_distribution

    def __call__(self):
        fixed_bit_vector = BitVector(size=self.length)

        for i in range(self.length):
            fixed_bit_vector[i] = random.random() < self.value_distribution

        return fixed_bit_vector

class Mutator(object):
    def __init__(self, bit_mutation_rate):
        self.bit_mutation_rate = bit_mutation_rate

    def __call__(self, fixed_bit_vector):
        for i in range(len(fixed_bit_vector)):
            if random.random() < self.bit_mutation_rate:
                fixed_bit_vector[i] = not fixed_bit_vector[i]

        return fixed_bit_vector

class Crossover(object):
    def __init__(self, min_crossover_points, max_crossover_points):
        self.min_crossover_points = min_crossover_points
        self.max_crossover_points = max_crossover_points

    def __call__(self, a, b):
        def pairwise(iterable):
            "s -> (s0,s1), (s1,s2), (s2, s3), ..."
            a, b = itertools.tee(iterable)
            next(b, None)
            return zip(a, b)

        length = len(a)
        assert len(a) == len(b)

        num_points = random.randint(
            self.min_crossover_points, self.max_crossover_points)

        segment_endpoints = [0] + random.sample(
            list(range(1, length)), num_points) + [length]

        for f, t in itertools.islice(pairwise(segment_endpoints), 0, None, 2):
            # Swap bit values in crossover segment
            a[f:t], b[f:t] = b[f:t], a[f:t]

        return a, b

