from collections import namedtuple
import numpy as np
import random

import jssp.types
import jssp.utility

Config = namedtuple('Config', [
    'num_scouts',
    'num_normal_sites',
    'num_elite_sites',
    'num_normal_bees',
    'num_elite_bees'])

def mutate_preference(problem, preference):
    machine_index = random.randrange(problem.machine_count)

    first_index   = random.randrange(problem.job_count)
    second_index  = random.randrange(problem.job_count)

    first_job  = preference[machine_index, first_index]
    second_job = preference[machine_index, second_index]

    preference[machine_index, second_index] = first_job
    preference[machine_index, first_index]  = second_job

class Optimizer(object):
    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def best(self):
        return self.best_solution

    def initialize(self):
        self.site_preferences = np.zeros((self.config.num_scouts, self.problem.machine_count, self.problem.job_count), int)
        self.site_makespans   = np.zeros(self.config.num_scouts)

        for k in range(self.config.num_scouts):
            for m in range(self.problem.machine_count):
                self.site_preferences[k, m] = np.random.permutation(self.problem.job_count)

            _, _, self.site_makespans[k] = jssp.utility.develop_schedule(self.problem, self.site_preferences[k])

        self.next_site_preferences = self.site_preferences.copy()
        self.next_site_makespans   = self.site_makespans.copy()

        index = np.argmin(self.site_makespans)
        self.best_solution = jssp.types.Solution(self.site_preferences[index].copy(), self.site_makespans[index])

    def iterate(self):
        sorted_site_indexes = np.argsort(self.site_makespans)

        for es in range(self.config.num_elite_sites):
            elite_site_index = sorted_site_indexes[es]

            best_site_preference = self.site_preferences[elite_site_index].copy()
            best_site_makespan   = self.site_makespans[elite_site_index]

            original_site_schedule, original_site_allocations, original_site_makespan = jssp.utility.develop_schedule(
                self.problem, self.site_preferences[elite_site_index])

            original_site_reorderings = jssp.utility.find_reorderings(self.problem, original_site_allocations)

            for eb in range(self.config.num_elite_bees):
                if original_site_reorderings:
                    reordering = random.choice(original_site_reorderings)
                    original_site_reorderings.remove(reordering)

                    elite_site_preference, _, elite_site_makespan = jssp.utility.develop_schedule(
                        self.problem, original_site_schedule, reordering)
                else:
                    elite_site_preference = self.site_preferences[elite_site_index].copy()
                    mutate_preference(self.problem, elite_site_preference)
                    _, _, elite_site_makespan = jssp.utility.develop_schedule(self.problem, elite_site_preference)

                if elite_site_makespan < best_site_makespan:
                    best_site_preference = elite_site_preference
                    best_site_makespan   = elite_site_makespan

            self.next_site_preferences[es] = best_site_preference
            self.next_site_makespans[es]   = best_site_makespan

        for ns in range(self.config.num_normal_sites):
            i = self.config.num_elite_sites + ns
            normal_site_index = sorted_site_indexes[i]

            best_site_preference = self.site_preferences[normal_site_index].copy()
            best_site_makespan   = self.site_makespans[normal_site_index]

            original_site_schedule, original_site_allocations, original_site_makespan = jssp.utility.develop_schedule(
                self.problem, self.site_preferences[normal_site_index])

            original_site_reorderings = jssp.utility.find_reorderings(self.problem, original_site_allocations)

            for nb in range(self.config.num_normal_bees):
                if original_site_reorderings:
                    reordering = random.choice(original_site_reorderings)
                    original_site_reorderings.remove(reordering)

                    normal_site_preference, _, normal_site_makespan = jssp.utility.develop_schedule(
                        self.problem, original_site_schedule, reordering)
                else:
                    normal_site_preference = self.site_preferences[normal_site_index].copy()
                    mutate_preference(self.problem, normal_site_preference)
                    _, _, normal_site_makespan = jssp.utility.develop_schedule(self.problem, normal_site_preference)

                if normal_site_makespan < best_site_makespan:
                    best_site_preference = normal_site_preference
                    best_site_makespan   = normal_site_makespan

            self.next_site_preferences[i] = best_site_preference
            self.next_site_makespans[i]   = best_site_makespan

        for k in range(self.config.num_elite_sites + self.config.num_normal_sites, self.config.num_scouts):
            for m in range(self.problem.machine_count):
                self.next_site_preferences[k, m] = np.random.permutation(self.problem.job_count)
            _, _, self.next_site_makespans[k] = jssp.utility.develop_schedule(self.problem, self.next_site_preferences[k])

        self.site_preferences, self.next_site_preferences = self.next_site_preferences, self.site_preferences
        self.site_makespans, self.next_site_makespans     = self.next_site_makespans, self.site_makespans

        index = np.argmin(self.site_makespans)
        if not self.best_solution or self.site_makespans[index] < self.best_solution.makespan:
            self.best_solution = jssp.types.Solution(self.site_preferences[index].copy(), self.site_makespans[index])

        return jssp.types.Solution(None, min(self.site_makespans))