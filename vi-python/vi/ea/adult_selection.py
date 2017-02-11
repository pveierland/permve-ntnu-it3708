import itertools
import operator

class FullGenerationalReplacement(object):
    def __call__(self, population, child_generator):
        population_size = len(population)
        next_generation = list(itertools.islice(child_generator, population_size))
        return next_generation

class GenerationalMixing(object):
    def __init__(self, population_size, num_children, elitism_ratio):
        self.population_size = population_size
        self.num_children    = num_children
        self.elitism_ratio   = elitism_ratio
        self.keep_count      = round(population_size * elitism_ratio)

    def __call__(self, population, child_generator):
        next_generation = population[:]
        
        if self.keep_count:
            next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
            next_generation = next_generation[:self.keep_count]

        next_generation.extend(itertools.islice(child_generator, self.num_children if self.num_children else self.population_size - self.keep_count))
        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
        next_generation = next_generation[:self.population_size]

        return next_generation

class Overproduction(object):
    def __init__(self, num_extra_children):
        self.num_extra_children = num_extra_children

    def __call__(self, population, child_generator):
        population_size = len(population)
        num_competitors = population_size + self.num_extra_childrenc

        next_generation = list(itertools.islice(child_generator, num_competitors))
        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

