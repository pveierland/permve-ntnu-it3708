import collections
import random
import statistics

class FitnessProportionate(object):
    Artifacts = collections.namedtuple('Artifacts', ['fitness_sum'])

    def __call__(self, population, artifacts):
        random_fitness_sum  = random.uniform(0.0, artifacts.fitness_sum)
        selected_individual = None

        for individual in population:
            fitness = individual.fitness

            if fitness > 0.0:
                selected_individual = individual
                random_fitness_sum -= fitness

                if random_fitness_sum < 0.0:
                    break

        return selected_individual

    def prepare(self, population):
        fitness_sum = sum(individual.fitness for individual in population)
        return FitnessProportionate.Artifacts(fitness_sum)

class Rank(object):
    def __init__(self, max_expected_value):
        self.max_expected_value = max_expected_value
        self.min_expected_value = 2.0 - max_expected_value

    def __call__(self, population, artifacts):
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

    def prepare(self, population):
        population.sort(key=operator.attrgetter('fitness'), reverse=True)
        return None

class Sigma(object):
    Artifacts = collections.namedtuple(
        'Artifacts', ['expected_values', 'expected_values_sum'])

    def __call__(self, population, artifacts):
        selected_individual   = None
        random_expected_value = random.uniform(0.0, artifacts.expected_values_sum)

        for individual, expected_value in zip(
            population, artifacts.expected_values):

            selected_individual    = individual
            random_expected_value -= expected_value

            if random_expected_value < 0.0:
                break

        return selected_individual

    def prepare(self, population):
        fitness_values  = [individual.fitness for individual in population]
        fitness_mean    = statistics.mean(fitness_values)
        fitness_pstddev = statistics.pstddev(fitness_values)

        expected_values = [
            1.0 + (fitness_value - fitness_mean) / (2.0 * fitness_pstddev)
            for fitness_value in fitness_values]

        expected_values_sum = sum(expected_values)

        return Sigma.Artifacts(expected_values, expected_values_sum)

class Tournament(object):
    def __init__(self, group_size, random_selection_probability):
        self.group_size                   = group_size
        self.random_selection_probability = random_selection_probability

    def __call__(self, population, artifacts):
        group = random.sample(population, self.group_size)

        if random.random() < self.random_selection_probability:
            selected_individual = random.choice(group)
        else:
            selected_individual = max(group, key=operator.attrgetter('fitness'))

    def prepare(self, population):
        return None

