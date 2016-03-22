import copy

class Sexual(object):
    def __init__(self, crossover_function, mutation_function):
        self.crossover_function = crossover_function
        self.mutation_function  = mutation_function

    def __call__(self, parent_selector):
        parent_a = next(parent_selector)
        parent_b = next(parent_selector)

        child_a_genotype = copy.deepcopy(parent_a.genotype)
        child_b_genotype = copy.deepcopy(parent_b.genotype)

        child_a_genotype, child_b_genotype = \
            self.crossover_function(child_a_genotype, child_b_genotype)

        child_a_genotype = self.mutation_function(child_a_genotype)
        child_b_genotype = self.mutation_function(child_b_genotype)

        return [child_a_genotype, child_b_genotype]

