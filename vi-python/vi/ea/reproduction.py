import copy
import random

class Sexual(object):
    def __init__(self, crossover_rate, crossover_function, mutation_rate, mutation_function):
        self.crossover_rate     = crossover_rate
        self.crossover_function = crossover_function
        self.mutation_rate      = mutation_rate
        self.mutation_function  = mutation_function

    def __call__(self, parent_selector):
        parent_a = next(parent_selector)
        parent_b = next(parent_selector)

        child_a_genotype = copy.deepcopy(parent_a.genotype)
        child_b_genotype = copy.deepcopy(parent_b.genotype)

        if random.random() < self.crossover_rate:
            child_a_genotype, child_b_genotype = \
                self.crossover_function(child_a_genotype, child_b_genotype)

        if self.mutation_function:
            if random.random() < self.mutation_rate:
                child_a_genotype = self.mutation_function(child_a_genotype)

            if random.random() < self.mutation_rate:
                child_b_genotype = self.mutation_function(child_b_genotype)

        return [child_a_genotype, child_b_genotype]