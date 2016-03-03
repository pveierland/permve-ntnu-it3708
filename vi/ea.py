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

