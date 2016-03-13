#!/usr/bin/python3

import sys
sys.path.append('../')

import operator

import vi.ea.adult_selection
import vi.ea.fixed_bit_vector
import vi.ea.parent_selection
import vi.ea.reproduction
import vi.ea.system

fitness_function = \
    lambda genotype: genotype.count_bits() / genotype.length()

system = vi.ea.system.System(
    vi.ea.fixed_bit_vector.Creator(length=50),
    vi.ea.parent_selection.Sigma(),
    vi.ea.adult_selection.GenerationalMixing(25),
    vi.ea.reproduction.Sexual(
        vi.ea.fixed_bit_vector.Crossover(1),
        vi.ea.fixed_bit_vector.Mutator(0.05)),
    lambda genotype: genotype.count_bits() / genotype.length(),
    population_size=50)

for _ in range(100):
    best_individual = max(system.population, key=operator.attrgetter('fitness'))
    print('{} -> {}'.format(best_individual.genotype, best_individual.fitness))
    system.evolve()

