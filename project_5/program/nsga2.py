class Nsga2(object):
    class Individual(object):
        def __init__(self, genotype, objective_values):
            self.genotype          = genotype
            self.objective_values  = objective_values

            self.S                 = []
            self.n                 = 0
            self.crowding_distance = 0

    @staticmethod
    def crowding_distance_operator(a, b):
        if a.rank < b.rank or (a.rank == b.rank and a.crowding_distance > b.crowding_distance):
            return -1
        elif b.rank < a.rank or (b.rank == a.rank and b.crowding_distance > a.crowding_distance):
            return 1
        else:
            return 0

#    @staticmethod
#    def rank_operator(a, b):
#        if a.rank < b.rank:
#            return -1
#        elif b.rank < a.rank:
#            return 1
#        else:
#            return 0

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
        fronts = [[] for _ in range(self.options['population_size'])]

        population = [
            Nsga2.Individual(genotype, self.objective_evaluator(genotype))
            for _ in range(self.options['population_size'])]

        self.fast_non_dominated_sort(fronts, population)

        offspring = []
        self.generate_individuals(population, offspring)

        self.population = population
        self.offspring  = offspring

    def crowding_distance_assignment(self, individuals, is_non_dominated_front):
        for individual in individuals:
            individual.crowding_distance = 0

        for objective in range(self.objective_count):
            individuals.sort(key=lambda x: x.objective_values[i])

            min_individual = individuals[0]
            max_individual = individuals[-1]

            self.range_min[objective] = min(
                self.range_min[objective], min_individual.objective_values[objective])
            self.range_max[objective] = max(
                self.range_max[objective], max_individual.objective_values[objective])

            if is_non_dominated_front:
                self.extreme_min[objective] = min_individual
                self.extreme_max[objective] = max_individual

            range_delta   = self.range_max[objective] - self.range_min[objective]
            range_scaling = 1 / range_delta

            for i in range(1, len(individuals) - 1):
                individuals[i].crowding_distance += (range_scaling *
                    (individuals[i + 1].objective_values[objective] -
                     individuals[i - 1].objective_values[objective]))

#        individuals.sort(key=operator.attrgetter('cost'))
#
#        self.cost_min = min(self.cost_min, individuals[0].cost)
#        self.cost_max = max(self.cost_max, individuals[-1].cost)
#
#        if is_non_dominated_front:
#            self.extreme_individual_cost_min = individuals[0]
#            self.extreme_individual_cost_max = individuals[-1]
#
#        individuals[0].crowding_distance = float('inf')
#        individuals[-1].crowding_distance = float('inf')
#
#        cost_delta   = self.cost_max - self.cost_min
#        cost_scaling = 1 / cost_delta
#
#        for i in range(1, len(individuals) - 1):
#            individuals[i].crowding_distance += (
#                (individuals[i + 1].cost - individuals[i - 1].cost) * cost_scaling)
#
#        individuals.sort(key=operator.attrgetter('distance'))
#
#        self.distance_min = min(self.distance_min, individuals[0].distance)
#        self.distance_max = max(self.distance_max, individuals[-1].distance)
#
#        individuals[0].crowding_distance = float('inf')
#        individuals[-1].crowding_distance = float('inf')
#
#        distance_delta   = self.distance_max - self.distance_min
#        distance_scaling = 1 / distance_delta
#
#        for i in range(1, len(individuals) - 1):
#            individuals[i].crowding_distance += (
#                (individuals[i + 1].distance - individuals[i - 1].distance) * distance_scaling)

    def evolve(self):
        offspring = []
        self.generate_individuals(self.population, offspring, Nsga2.crowding_distance_operator)
        self.population.extend(offspring)
        self.fast_non_dominated_sort(self.fronts, self.population)

        next_population     = []
        non_dominated_front = None

        for front in self.fronts:
            self.crowding_distance_assignment(front)

            remaining = self.population_size - len(next_population)

            if len(front) <= remaining:
                next_population.extend(front)
                non_dominated_front = non_dominated_front or front
            else:
                # Shuffle to avoid order bias from crowding_distance_assignment
                random.shuffle(front)
                front.sort(key=functools.cmp_to_key(crowding_distance_operator))
                next_population.extend(front[:remaining])
                non_dominated_front = non_dominated_front or front[:remaining]

            if len(next_population) == self.population_size:
                break

        self.non_dominated_front = non_dominated_front
        self.population          = next_population

        self.generation += 1

    def fast_non_dominated_sort(self, fronts, P):
        for front in fronts:
            front.clear()

        for p in P:
            p.S = []
            p.n = 0

            for q in P:
                if p.objective_values < q.objective_values:
                    # p dominates q
                    p.S.append(q)
                elif q.objective_values < p.objective_values:
                    # q dominates p
                    p.n += 1

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
            parent_a = self.tournament_rank_selector(population)
            parent_b = self.tournament_rank_selector(population)

            if (self.options['crossover_rate'] == 1 or
                random.random() < self.options['crossover_rate']):

                child_a_genotype, child_b_genotype = self.crossover_operator(
                    parent_a.genotype, parent_b.genotype)
            else:
                child_a_genotype, child_b_genotype = parent_a.genotype, parent_b.genotype

            child_a = self.create_individual(child_a_genotype)
            child_b = self.create_individual(child_b_genotype)

            if random.random() < self.options['mutation_rate']:
                self.mutate_genotype(child_a.genotype)

            if random.random() < self.options['mutation_rate']:
                self.mutate_genotype(child_b.genotype)

            offspring.append(child_a)
            offspring.append(child_b)

    def tournament_selector(self, individuals):
        group = random.sample(individuals, self.options['tournament_group_size'])

        if (self.options['tournament_randomness'] == 0 or
            random.random() >= self.options['tournament_randomness']):
            return min(group, key=Nsga2.crowding_distance_operator)
        else:
            return random.choice(group)


#    def tournament_crowding_distance_selector(self, individuals):
#        group = random.sample(individuals, self.tournament_group_size)
#
#        if random.random() >= self.tournament_randomness:
#            return min(group, key=functools.cmp_to_key(crowding_distance_operator))
#        else:
#            return random.choice(group)
#
#    def tournament_rank_selector(self, individuals):
#        group = random.sample(individuals, self.tournament_group_size)
#
#        if random.random() >= self.tournament_randomness:
#            return min(group, key=functools.cmp_to_key(rank_operator))
#        else:
#            return random.choice(group)

