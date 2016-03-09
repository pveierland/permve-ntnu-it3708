import random
import statistics

class fitness_proportionate(object):
    def __call__(self):
        random_fitness_sum  = random.uniform(0.0, self.fitness_sum)
        selected_individual = None

        for individual in self.population:
            fitness = individual.fitness()

            if fitness > 0.0:
                selected_individual = individual
                random_fitness_sum -= fitness

                if random_fitness_sum < 0.0:
                    break

        return selected_individual

    def register_population(self, population):
        self.fitness_sum = sum(individual.fitness() for individual in population)
        self.population  = population

class rank(object):
    def __init__(self, max_expected_value):
        self.max_expected_value = max_expected_value
        self.min_expected_value = 2.0 - max_expected_value

    def __call__(self):
        selected_individual     = None
        population_size         = len(self.population)
        random_expected_fitness = random.uniform(0.0, population_size)

        for rank_index, individual in enumerate(self.population, 1):
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
        self.population = population

class sigma(object):
    def __call__(self):
        selected_individual   = None
        random_expected_value = random.uniform(0.0, self.expected_values_sum)

        for individual, expected_value in zip(self.population, self.expected_values):
            selected_individual    = individual
            random_expected_value -= expected_value

            if random_expected_value < 0.0:
                break

        return selected_individual

    def register_population(self, population):
        fitness_values  = [individual.fitness() for individual in population]
        fitness_mean    = statistics.mean(fitness_values)
        fitness_pstddev = statistics.pstddev(fitness_values)

        self.expected_values = [
            1.0 + (fitness_value - fitness_mean) / (2.0 * fitness_pstddev)
            for fitness_value in fitness_values]

        self.expected_values_sum = sum(self.expected_values)
        self.population = population

class tournament(object):
    def __init__(self, group_size, random_selection_probability):
        self.group_size                   = group_size
        self.random_selection_probability = random_selection_probability

    def __call__(self):
        group = random.sample(self.population, self.group_size)

        if random.random() < self.random_selection_probability:
            selected_individual = random.choice(group)
        else:
            selected_individual = max(group, key=operator.methodcaller('fitness'))

    def register_population(self, population):
        self.population = population

