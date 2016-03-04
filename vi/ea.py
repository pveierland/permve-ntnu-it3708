import random

class fitness_proportionate(object):
    def __call__(self, population):
        random_fitness_sum  = random.uniform(0.0, self.fitness_sum)
        selected_individual = None

        for individual in population:
            fitness = individual.fitness()

            if fitness > 0.0:
                selected_individual = individual
                random_fitness_sum -= fitness

                if random_fitness_sum < 0.0:
                    break

        return selected_individual

    def register_population(self, population):
        self.fitness_sum = sum(individual.fitness() for individual in population)

def rank(object):
    def __init__(self, max_expected_value):
        self.max_expected_value = max_expected_value
        self.min_expected_value = 2.0 - max_expected_value

    def __call__(self, population):
        selected_individual     = None
        population_size         = len(population)
        random_expected_fitness = random.uniform(0.0, population_size)

        for rank_index, individual in enumerate(population, 1):
            expected_reproduction = (self.min_expected_value
                + (self.max_expected_value - self.min_expected_value)
                  * (rank_index - 1) / (population_size - 1))

            random_expected_fitness -= expected_reproduction

            if random_expected_fitness < 0.0:
                selected_individual = individual
                break

        return selected_individual

    def register_population(self, population):
        population.sort(key=operator.methodcaller('fitness'), reverse=True)

class full_generational_replacement(object):
    def __init__(self, reproduction_function):
        self.reproduction_function = reproduction_function

    def __call__(self, population):
        population_size = len(population)
        next_generation = []

        generate_children = True

        while generate_children:
            children = self.reproduction_function(population)

            for child in children:
                if child.develop():
                    next_generation.append(child)

                    if len(next_generation) == population_size:
                        generate_children = False
                        break

        return next_generation

class generational_mixing(object):
    def __init__(self, reproduction_function, num_children):
        self.reproduction_function = reproduction_function
        self.num_children          = num_children

    def __call__(self, population):
        population_size = len(population)
        num_competitors = population_size + self.num_children

        next_generation   = population[:]
        generate_children = True

        while generate_children:
            children = self.reproduction_function(population)

            for child in children:
                if child.develop():
                    next_generation.append(child)

                    if len(next_generation) == num_competitors:
                        generate_children = False
                        break

        next_generation.sort(key=operator.methodcaller('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

class overproduction(object):
    def __init__(self, reproduction_function, num_children):
        self.reproduction_function = reproduction_function
        self.num_children          = num_children

    def __call__(self, population):
        population_size = len(population)

        next_generation = []
        generate_children = True

        while generate_children:
            children = self.reproduction_function(population)

            for child in children:
                if child.develop():
                    next_generation.append(child)

                if len(next_generation) == self.num_children:
                    generate_children = False
                    break

        next_generation.sort(key=operator.methodcaller('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

