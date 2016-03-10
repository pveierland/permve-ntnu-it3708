class FullGenerationalReplacement(object):
    def __call__(self, population, child_generator):
        population_size = len(population)
        next_generation = list(itertools.islice(child_generator, population_size))
        return next_generation

class GenerationalMixing(object):
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self, population, child_generator):
        next_generation = population[:]
        next_generation.extend(itertools.islice(child_generator, self.num_children))
        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)

        population_size = len(population)
        next_generation = next_generation[:population_size]

        return next_generation

class Overproduction(object):
    def __init__(self, num_children)
        self.num_children = num_children

    def __call__(self, population, child_generator):
        next_generation = list(itertools.islice(child_generator, self.num_children))
        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)

        population_size = len(population)
        next_generation = next_generation[:population_size]

        return next_generation

