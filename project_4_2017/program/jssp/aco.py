#!/usr/bin/env python3

from collections import namedtuple
import math
import numpy as np
import random

import jssp.types
import jssp.utility

Config = namedtuple('Config', [
    'evaporation_rate',
    'beta',
    'tabu_search_tenure',
    'initial_pheromone_value'])

class Optimizer(object):
    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def initialize(self):
        self.best_solution_since_restart = None
        self.best_solution_ever          = None
        self.convergence_factor          = 0.0
        self.bs_update                   = False

        self.num_operations         = self.problem.job_count * self.problem.machine_count
        self.tabu_search_iterations = round(0.5 * self.num_operations)

        self.num_ants   = self.calculate_num_ants()
        self.pheromones = np.full((self.num_operations, self.num_operations), self.config.initial_pheromone_value)

    def compute_convergence_factor(self):
        max_pheromone_value = self.pheromones.max()
        min_pheromone_value = self.pheromones.min()
        return 2.0 * ((np.maximum(max_pheromone_value - self.pheromones, self.pheromones - min_pheromone_value).sum() /
                       (self.pheromones.size * (max_pheromone_value - min_pheromone_value))) - 0.5)

    def calculate_num_ants(self):
        return max(10, math.floor(self.num_operations / 10))

    def construct_solution(self, restrict):
        def compute_earliest_start_time(operation):
            return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

        def compute_earliest_completion_time(operation):
            return compute_earliest_start_time(operation) + operation.time_steps

        operations = []

        not_scheduled = [[] for _ in range(self.problem.machine_count)]
        for operation_sequence in self.problem.jobs:
            for operation in operation_sequence:
                not_scheduled[operation.machine].append(operation)

        possible = [operation_sequence[0] for operation_sequence in self.problem.jobs]
        
        job_completion_times     = np.zeros(self.problem.job_count)
        machine_completion_times = np.zeros(self.problem.machine_count)
        job_sequence_indexes     = np.zeros(self.problem.job_count, int)
        machine_sequence_indexes = np.zeros(self.problem.machine_count, int)

        while possible:
            start_times = [compute_earliest_start_time(operation) for operation in possible]

            if restrict and restrict == 'nd':
                earliest_starting_time = min(start_times)
                restricted_operations  = [operation for operation, start_time in zip(possible, start_times)
                                                    if start_time == earliest_starting_time]
            else:
                restricted_operations = possible

            heuristic_terms     = [1.0 / (start_time + 1.0) for start_time in start_times]
            heuristic_terms_sum = sum(heuristic_terms)
            heuristic_values    = [(heuristic_term / heuristic_terms_sum) ** self.config.beta for heuristic_term in heuristic_terms]

            operation_probability_terms = [
                min((self.pheromones[operation.index, other_operation.index] * heuristic_value
                     for other_operation in not_scheduled[operation.machine]
                     if other_operation is not operation), default=0.0)
                for operation, heuristic_value in zip(restricted_operations, heuristic_values)]

            operation_probability_terms_sum = sum(operation_probability_terms)

            if operation_probability_terms_sum:
                operation_probabilities = [
                    operation_probability_term / operation_probability_terms_sum
                    for operation_probability_term in operation_probability_terms]

                selected_operation_index = np.random.choice(len(restricted_operations), p=operation_probabilities)
                selected_operation       = restricted_operations[selected_operation_index]
            else:
                selected_operation = random.choice(restricted_operations)

            job_sequence_index = job_sequence_indexes[selected_operation.job]
            job_sequence_indexes[selected_operation.job] += 1

            machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
            machine_sequence_indexes[selected_operation.machine] += 1

            operation_start_time      = compute_earliest_start_time(selected_operation)
            operation_completion_time = operation_start_time + selected_operation.time_steps

            job_completion_times[selected_operation.job]         = operation_completion_time
            machine_completion_times[selected_operation.machine] = operation_completion_time

            operations.append(selected_operation)

            not_scheduled[selected_operation.machine].remove(selected_operation)
            possible.remove(selected_operation)

            if job_sequence_index < self.problem.machine_count - 1:
                possible.append(self.problem.jobs[selected_operation.job][job_sequence_index + 1])

        makespan = max(machine_completion_times)

        return jssp.types.Solution(operations, makespan)

    def iterate(self):
        iteration_solutions = [self.construct_solution(random.choice([None, 'nd'])) for _ in range(self.num_ants)]
        iteration_solutions = [jssp.utility.apply_local_search(self.problem, iteration_solution)[0] for iteration_solution in iteration_solutions]

        best_solution_in_iteration = min(iteration_solutions, key=lambda solution: solution.makespan)

        best_solution_in_iteration = jssp.utility.tabu_search(
            self.problem, best_solution_in_iteration, self.tabu_search_iterations, self.config.tabu_search_tenure)

        if not self.best_solution_since_restart or best_solution_in_iteration.makespan < self.best_solution_since_restart.makespan:
            self.best_solution_since_restart = best_solution_in_iteration

        if not self.best_solution_ever or best_solution_in_iteration.makespan < self.best_solution_ever.makespan:
            self.best_solution_ever = best_solution_in_iteration

        self.update_pheromones(self.best_solution_ever if self.bs_update else self.best_solution_since_restart)

        self.convergence_factor = self.compute_convergence_factor()

        if self.convergence_factor > 0.99:
            if self.bs_update:
                self.pheromones[:] = self.config.initial_pheromone_value
                self.best_solution_since_restart = None
                self.bs_update = False
            else:
                self.bs_update = True

        return self.best_solution_ever

    def update_pheromones(self, solution):
        for first_index, first_operation in enumerate(solution.operations):
            for second_index, second_operation in enumerate(solution.operations):
                self.pheromones[first_operation.index, second_operation.index] = \
                    np.clip(self.pheromones[first_operation.index, second_operation.index] +
                            self.config.evaporation_rate * (float(first_index < second_index) - self.pheromones[first_operation.index, second_operation.index]),
                            0.001, 0.999)