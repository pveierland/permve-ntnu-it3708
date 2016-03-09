def fill_population(
    system, 
    past_generation, next_generation, population_target_size, system)

    parent_selection_function.register_population(past_generation)

    generate_children = True

    while generate_children:
        children_genotypes = reproduction_function(parent_selection_function)

        for child_genotype in children_genotypes:
            child_phenotype = development_function(child_genotype)
            child_fitness   = fitness_function(child_phenotype)

            if child_phenotype and child_genotype:
                child_individual = Individual(
                    child_genotype, child_phenotype, child_fitness)
                next_generation.append(child_individual)

                if len(next_generation) == population_limit:
                    generate_children = False
                    break

class full_generational_replacement(object):
    def __call__(self,
                 population,
                 parent_selection_function,
                 reproduction_function,
                 development_function,
                 fitness_function):

        population_size = len(population)
        next_generation = []

        fill_population(population,
                        next_generation,
                        population_size,
                        parent_selection_function,
                        reproduction_function,
                        development_function,
                        fitness_function):

        return next_generation

class generational_mixing(object):
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self,
                 population,
                 parent_selection_function,
                 reproduction_function,
                 development_function,
                 fitness_function):

        population_size = len(population)
        num_competitors = population_size + self.num_children
        next_generation = population[:]

        fill_population(population,
                        next_generation,
                        num_competitors,
                        reproduction_function,
                        development_function,
                        fitness_function):

        next_generation.sort(key=operator.methodcaller('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

class overproduction(object):
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self,
                 population,
                 reproduction_function,
                 development_function,
                 fitness_function):

        population_size = len(population)
        next_generation = []

        fill_population(population,
                        next_generation,
                        self.num_children,
                        reproduction_function,
                        development_function,
                        fitness_function):

        next_generation.sort(key=operator.methodcaller('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

