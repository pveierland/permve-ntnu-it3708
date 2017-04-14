from collections import namedtuple
import random

import jssp.types
import jssp.utility

Config = namedtuple('Config', [
    'num_scouts',
    'num_normal_sites',
    'num_elite_sites',
    'num_normal_bees',
    'num_elite_bees',
    'taboo'])

class Optimizer(object):
    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def initialize(self):
        self.sites = []

        for _ in range(self.config.num_scouts):
            schedule = jssp.utility.generate_schedule_insertion_algorithm(self.problem)
            makespan = jssp.utility.compute_makespan(self.problem, schedule)
            self.sites.append((schedule, makespan))

        self.sites.sort(key=lambda site: site[1])

    def iterate(self):
        for es in range(self.config.num_elite_sites):
            site_index = es
            site_schedule, site_makespan = self.sites[site_index]

            best_site_schedule = site_schedule
            best_site_makespan = site_makespan

            for eb in range(self.config.num_elite_bees):
                new_schedule, new_makespan = jssp.utility.taboo_search(
                    self.problem, site_schedule, site_makespan, self.config.taboo)

                if new_makespan < best_site_makespan:
                    best_site_schedule = new_schedule
                    best_site_makespan = new_makespan

            self.sites[site_index] = (best_site_schedule, best_site_makespan)

        for ns in range(self.config.num_normal_sites):
            site_index       = self.config.num_elite_sites + ns
            site_schedule, _ = self.sites[site_index]

            site_allocations, site_makespan = jssp.utility.compute_allocations(self.problem, site_schedule)
            site_moves = jssp.utility.find_neighborhood_moves(self.problem, site_allocations, site_makespan)

            best_site_schedule = site_schedule
            best_site_makespan = site_makespan

            for nb in range(self.config.num_normal_bees):
                new_schedule = jssp.utility.apply_move(self.problem, site_schedule, random.choice(site_moves))
                new_makespan = jssp.utility.compute_makespan(self.problem, new_schedule)

                if new_makespan < best_site_makespan:
                    best_site_schedule = new_schedule
                    best_site_makespan = new_makespan

            self.sites[site_index] = (best_site_schedule, best_site_makespan)

        for k in range(self.config.num_elite_sites + self.config.num_normal_sites, self.config.num_scouts):
            schedule = jssp.utility.generate_schedule_insertion_algorithm(self.problem)
            makespan = jssp.utility.compute_makespan(self.problem, schedule)
            self.sites[k] = (schedule, makespan)

        self.sites.sort(key=lambda site: site[1])

        return jssp.types.Solution(self.sites[0][0], self.sites[0][1])