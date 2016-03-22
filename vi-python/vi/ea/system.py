import itertools

def child_generator(parent_selector,
                    reproduction_function,
                    development_function,
                    fitness_function):
    while True:
        children_genotypes = reproduction_function(parent_selector)

        for child_genotype in children_genotypes:
            child_phenotype = development_function(child_genotype) \
                              if development_function else child_genotype

            if child_phenotype:
                child_fitness = fitness_function(child_phenotype)

                if child_phenotype and child_fitness:
                    yield Individual(
                        child_genotype, child_phenotype, child_fitness)

def individual_generator(creation_function, development_function, fitness_function):
    while True:
        genotype  = creation_function()
        phenotype = development_function(genotype) \
                    if development_function else genotype

        if phenotype:
            fitness = fitness_function(phenotype)

            if phenotype and fitness:
                yield Individual(genotype, phenotype, fitness)

def parent_selector(population, parent_selection_function):
    artifacts = parent_selection_function.prepare(population)

    while True:
        yield parent_selection_function(population, artifacts)

class Individual(object):
    def __init__(self, genotype, phenotype, fitness):
        self.genotype  = genotype
        self.phenotype = phenotype
        self.fitness   = fitness

class System(object):
    def __init__(self,
                 creation_function,
                 parent_selection_function,
                 adult_selection_function,
                 reproduction_function,
                 fitness_function,
                 population_size,
                 development_function=None):

        self.creation_function         = creation_function
        self.development_function      = development_function
        self.parent_selection_function = parent_selection_function
        self.adult_selection_function  = adult_selection_function
        self.reproduction_function     = reproduction_function
        self.fitness_function          = fitness_function
        self.population_size           = population_size

        self.__create_initial_population()

    def __create_initial_population(self):
        population_individual_generator = individual_generator(
            self.creation_function,
            self.development_function,
            self.fitness_function)

        self.population = list(itertools.islice(
            population_individual_generator, self.population_size))

    def evolve(self):
        population_parent_selector = parent_selector(
            self.population, self.parent_selection_function)

        population_child_generator = child_generator(
            population_parent_selector,
            self.reproduction_function,
            self.development_function,
            self.fitness_function)

        self.population = self.adult_selection_function(
            self.population, population_child_generator)

