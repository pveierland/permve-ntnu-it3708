def fill_population(system, past_generation, next_generation, fill_size):

    parent_selector = partial(
        system.parent_selection_function.__call__,
        past_generation,
        system.parent_selection_function.prepare(past_generation))

    while len(next_generation) < fill_size:
        children = system.child_generation_function()
        next_generation.extend(children[:len(next_generation) - fill_size])

def generate_children(system):
    child_genotypes = system.reproduction_function(parent_selector)

    for child_genotype in child_genotypes:
        child_phenotype = system.development_function(child_genotype)

        if child_phenotype:
            child_fitness = system.fitness_function(child_phenotype)

            if child_fitness:
                yield Individual(child_genotype,
                                 child_phenotype,
                                 child_fitness)

class FullGenerationalReplacement(object):
    def __call__(self, system, population):
        population_size = len(population)
        next_generation = []

        parent_selector = partial(

        parent_selection_cache =
            system.parent_selection_function.prepare(population)



        fill_population(system, population, next_generation, population_size)

        return next_generation

class GenerationalMixing(object):
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self, system, population):
        population_size = len(population)
        num_competitors = population_size + self.num_children
        next_generation = population[:]

        fill_population(system, population, next_generation, num_competitors)

        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

class Overproduction(object):
    def __init__(self, num_children)
        self.num_children = num_children

    def __call__(self, system, population):
        population_size = len(population)
        next_generation = []

        fill_population(system, population, next_generation, self.num_children)

        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

