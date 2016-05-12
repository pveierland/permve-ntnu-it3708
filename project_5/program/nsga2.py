import functools
import random

class Nsga2(object):
    @functools.total_ordering
    class Individual(object):
        __slots__ = ['genotype', 'objective_values', 'crowding_distance', 'S', 'n', 'rank']

        def __init__(self, genotype, objective_values):
            self.genotype          = genotype
            self.objective_values  = objective_values

            self.crowding_distance = 0
            self.S                 = []
            self.n                 = 0
            self.rank              = 0

        def dominates(self, other):
            return all((a < b) for a, b in zip(self.objective_values, other.objective_values))

        def __lt__(self, other):
            return (self.rank < other.rank or
                   (self.rank == other.rank and
                    self.crowding_distance > other.crowding_distance))

        def __str__(self):
            return 'Individual({})'.format(','.join(str(v) for v in self.objective_values))

    def __init__(self,
                 options,
                 genotype_creator,
                 objective_evaluator,
                 crossover_operator,
                 mutation_operator):

        self.options             = options
        self.genotype_creator    = genotype_creator
        self.objective_evaluator = objective_evaluator
        self.crossover_operator  = crossover_operator
        self.mutation_operator   = mutation_operator

        self.range_min = [ float('+inf') for _ in range(self.options['objective_count']) ]
        self.range_max = [ float('-inf') for _ in range(self.options['objective_count']) ]

        self.extreme_min = [ None for _ in range(self.options['objective_count']) ]
        self.extreme_max = [ None for _ in range(self.options['objective_count']) ]

        self.create_initial_population()
        self.generation = 0

    def create_initial_population(self):
        self.fronts     = [[] for _ in range(self.options['population_size'])]

        self.population = []
        for _ in range(self.options['population_size']):
            genotype         = self.genotype_creator()
            objective_values = self.objective_evaluator(genotype)
            self.population.append(Nsga2.Individual(genotype, objective_values))

    def crowding_distance_assignment(self, individuals, is_non_dominated_front):
        for individual in individuals:
            individual.crowding_distance = 0

        for objective in range(self.options['objective_count']):
            individuals.sort(key=lambda x: x.objective_values[objective])

            min_individual = individuals[0]
            max_individual = individuals[-1]

            min_individual.crowding_distance = float('inf')
            max_individual.crowding_distance = float('inf')

            self.range_min[objective] = min(
                self.range_min[objective], min_individual.objective_values[objective])
            self.range_max[objective] = max(
                self.range_max[objective], max_individual.objective_values[objective])

            if is_non_dominated_front:
                self.extreme_min[objective] = min_individual

            if (not self.extreme_max[objective] or
                max_individual.objective_values[objective] > self.extreme_max[objective].objective_values[objective]):
                self.extreme_max[objective] = max_individual

            range_delta   = self.range_max[objective] - self.range_min[objective]
            range_scaling = 1 / range_delta if range_delta != 0 else 1

            for i in range(1, len(individuals) - 1):
                individuals[i].crowding_distance += (range_scaling *
                    (individuals[i + 1].objective_values[objective] -
                     individuals[i - 1].objective_values[objective]))

    def evolve(self):
        self.extreme_max = [ None for _ in range(self.options['objective_count']) ]

        offspring = []
        self.generate_individuals(self.population, offspring)
        self.population.extend(offspring)
        self.fast_non_dominated_sort(self.fronts, self.population)

        next_population = []
        remaining       = self.options['population_size']
        first           = True

        for i, front in enumerate(self.fronts):
            if remaining:
                self.crowding_distance_assignment(front, first)
                first      = False
                front_size = len(front)

                if front_size <= remaining:
                    next_population.extend(front)
                    remaining -= front_size
                else:
                    # Shuffle to avoid order bias from crowding_distance_assignment
                    random.shuffle(front)
                    front.sort()
                    next_population.extend(front[:remaining])
                    del front[remaining:]
                    remaining = 0
            else:
                if front:
                    front.clear()
                else:
                    break

        self.population  = next_population
        self.generation += 1

    def fast_non_dominated_sort(self, fronts, P):
        for front in fronts:
            if front:
                front.clear()
            else:
                break

        element_count = len(P)

        for p in P:
            p.S = []
            p.n = 0

        for i in range(element_count):
            p = P[i]
            for j in range(i, element_count):
                q = P[j]

                try:

                    if (p.objective_values[0] < q.objective_values[0] and
                        p.objective_values[1] < q.objective_values[1]):

                        p.S.append(q)
                        q.n += 1
                    elif (q.objective_values[0] < p.objective_values[0] and
                          q.objective_values[1] < p.objective_values[1]):

                        q.S.append(p)
                        p.n += 1

                except:
                    print(p.objective_values)
                    print(q.objective_values)
                    raise

            if p.n == 0:
                p.rank = 0
                fronts[0].append(p)

        front_index = 0

        while fronts[front_index]:
            for p in fronts[front_index]:
                for q in p.S:
                    q.n -= 1

                    if q.n == 0:
                        q.rank = front_index + 1
                        fronts[front_index + 1].append(q)

            front_index += 1

    def generate_individuals(self, population, offspring):
        while len(offspring) < len(population):
            parent_a = self.tournament_selector(population)
            parent_b = self.tournament_selector(population)

            if (self.options['crossover_rate'] == 1 or
                random.random() < self.options['crossover_rate']):

                child_a_genotype, child_b_genotype = self.crossover_operator(
                    parent_a.genotype, parent_b.genotype)
            else:
                child_a_genotype, child_b_genotype = parent_a.genotype[:], parent_b.genotype[:]

            if random.random() < self.options['mutation_rate']:
                self.mutation_operator(child_a_genotype)

            if random.random() < self.options['mutation_rate']:
                self.mutation_operator(child_b_genotype)

            child_a_objective_values = self.objective_evaluator(child_a_genotype)
            child_b_objective_values = self.objective_evaluator(child_b_genotype)

            offspring.append(Nsga2.Individual(child_a_genotype, child_a_objective_values))
            offspring.append(Nsga2.Individual(child_b_genotype, child_b_objective_values))

    def tournament_selector(self, individuals):
        group = random.sample(individuals, self.options['tournament_group_size'])

        if (self.options['tournament_randomness'] == 0 or
            random.random() >= self.options['tournament_randomness']):
            return min(group)
        else:
            return random.choice(group)
