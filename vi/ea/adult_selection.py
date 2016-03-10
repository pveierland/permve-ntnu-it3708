def fill_population(system, past_generation, next_generation, fill_size):
    system.parent_selection_function.register_population(past_generation)



    while len(next_generation) < fill_size:
        children = child_generation_function()
        next_generation.extend(children[:len(next_generation) - fill_size])

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

    def __call__(self, system):

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
    def __init__(self, num_children)
        self.num_children = num_children

    def __call__(self, system, population):
        population_size = len(population)
        next_generation = []

        fill_population(population, next_generation, self.num_children, system)

        next_generation.sort(key=operator.attrgetter('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

