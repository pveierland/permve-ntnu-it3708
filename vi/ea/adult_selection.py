class full_generational_replacement(object):
    def __call__(self, population, reproduction_function):
        population_size   = len(population)
        next_generation   = []
        generate_children = True

        while generate_children:
            children = reproduction_function(population)

            for child in children:
                if child.develop():
                    next_generation.append(child)

                    if len(next_generation) == population_size:
                        generate_children = False
                        break

        return next_generation

class generational_mixing(object):
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self, population, reproduction_function):
        population_size = len(population)
        num_competitors = population_size + self.num_children

        next_generation   = population[:]
        generate_children = True

        while generate_children:
            children = reproduction_function(population)

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
    def __init__(self, num_children):
        self.num_children = num_children

    def __call__(self, population, reproduction_function):
        population_size   = len(population)
        next_generation   = []
        generate_children = True

        while generate_children:
            children = reproduction_function(population)

            for child in children:
                if child.develop():
                    next_generation.append(child)

                if len(next_generation) == self.num_children:
                    generate_children = False
                    break

        next_generation.sort(key=operator.methodcaller('fitness'), reverse=True)
        next_generation = next_generation[:population_size]

        return next_generation

