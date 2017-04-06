#!/usr/bin/env python3

from collections import namedtuple
from multiprocessing.pool import ThreadPool
import numpy as np
import random
import sys

Allocation = namedtuple('Allocation', ['sequence', 'start_time', 'operation'])
Operation  = namedtuple('Operation', ['job', 'machine', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])
Solution   = namedtuple('Solution', ['schedule', 'makespan'])

def develop_schedule(problem, preference):
    def compute_earliest_start_time(operation):
        return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

    def compute_earliest_completion_time(operation):
        return compute_earliest_start_time(operation) + operation.time_steps

    def get_preferred_conflict_operation(conflict_set):
        for preferred_job in preference[earliest_operation.machine]:
            for conflict_operation in conflict_set:
                if preferred_job == conflict_operation.job:
                    return conflict_operation

    schedule    = np.full((problem.machine_count, problem.job_count), -1, int)
    allocations = [[] for _ in range(problem.machine_count)]
    possible    = [operation_sequence[0] for operation_sequence in problem.jobs]

    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    while possible:
        earliest_completion_time, earliest_operation = \
            min((compute_earliest_completion_time(operation), operation) for operation in possible)

        conflict_set = [operation for operation in possible
                        if operation.machine == earliest_operation.machine and
                        compute_earliest_start_time(operation) < earliest_completion_time]

        selected_operation = get_preferred_conflict_operation(conflict_set)

        job_sequence_index = job_sequence_indexes[selected_operation.job]
        job_sequence_indexes[selected_operation.job] += 1

        machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
        machine_sequence_indexes[selected_operation.machine] += 1

        operation_start_time      = compute_earliest_start_time(selected_operation)
        operation_completion_time = operation_start_time + selected_operation.time_steps

        job_completion_times[selected_operation.job]         = operation_completion_time
        machine_completion_times[selected_operation.machine] = operation_completion_time

        schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

        allocations[selected_operation.machine].append(
            Allocation(job_sequence_index, operation_start_time, selected_operation))

        possible.remove(selected_operation)

        if job_sequence_index < problem.machine_count - 1:
            possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

    makespan = max(machine_completion_times)

    return schedule, allocations, makespan

def parse_problem_file(filename):
    with open(filename) as input_file:
        input_lines = input_file.readlines()
        job_count, machine_count = map(int, input_lines[0].split())
        jobs = []

        for job_index in range(job_count):
            input_line = list(map(int, input_lines[job_index + 1].split()))
            jobs.append([Operation(job_index, machine_index, time_steps)
                         for machine_index, time_steps in zip(input_line[0::2], input_line[1::2])])

        return Problem(job_count, machine_count, jobs)

def generate_random_preference(problem):
    preference = np.zeros((problem.machine_count, problem.job_count))

    for m in range(problem.machine_count):
        preference[m] = np.random.permutation(problem.job_count)

    return preference

def generate_random_solution(problem):
    preference = generate_random_preference(problem)
    schedule, _, makespan = develop_schedule(problem, preference)
    return Solution(schedule, makespan)

def construct_solution(problem, pheromones, c_greedy, c_hist, c_heur):
    def compute_earliest_start_time(operation):
        return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

    def compute_earliest_completion_time(operation):
        return compute_earliest_start_time(operation) + operation.time_steps

    schedule = np.full((problem.machine_count, problem.job_count), -1, int)
    possible = [operation_sequence[0] for operation_sequence in problem.jobs]

    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    while possible:
        earliest_completion_time, earliest_operation = \
            min((compute_earliest_completion_time(operation), operation) for operation in possible)

        conflict_set = [operation for operation in possible
                        if operation.machine == earliest_operation.machine and
                        compute_earliest_start_time(operation) < earliest_completion_time]

        if random.random() < c_greedy:
            selected_operation = earliest_operation
        else:
            conflict_set_probabilities = [
                (pheromones[operation.machine, machine_sequence_indexes[operation.machine], operation.job] ** c_hist) *
                ((1.0 / (1.0 + compute_earliest_completion_time(operation) - earliest_completion_time)) ** c_heur)
                for operation in conflict_set
            ]

            random_selection = sum(conflict_set_probabilities) * random.random()

            for i, p in enumerate(conflict_set_probabilities):
                random_selection -= p
                if random_selection < 0:
                    selected_operation = conflict_set[i]
                    break
            else:
                selected_operation = conlict_set[-1]

        job_sequence_index = job_sequence_indexes[selected_operation.job]
        job_sequence_indexes[selected_operation.job] += 1

        machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
        machine_sequence_indexes[selected_operation.machine] += 1

        operation_start_time      = compute_earliest_start_time(selected_operation)
        operation_completion_time = operation_start_time + selected_operation.time_steps

        job_completion_times[selected_operation.job]         = operation_completion_time
        machine_completion_times[selected_operation.machine] = operation_completion_time

        schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

        possible.remove(selected_operation)

        if job_sequence_index < problem.machine_count - 1:
            possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

    makespan = max(machine_completion_times)

    return Solution(schedule, makespan)

def update_pheromones_local(problem, pheromones, candidate, c_local_pheromone, init_pheromone_value):
    for m in range(problem.machine_count):
        for j in range(problem.job_count):
            selected_job = candidate.schedule[m, j]
            pheromones[m, j, selected_job] = (1.0 - c_local_pheromone) * pheromones[m, j, selected_job] + c_local_pheromone * init_pheromone_value

def update_pheromones_global(problem, pheromones, candidate, decay):
    for m in range(problem.machine_count):
        for j in range(problem.job_count):
            selected_job = candidate.schedule[m, j]
            pheromones[m, j, selected_job] = (1.0 - decay) * pheromones[m, j, selected_job] + decay / candidate.makespan

class AntColonyOptimizer(object):
    Config = namedtuple('Config', [
        'num_ants',
        'c_greedy',
        'c_hist',
        'c_heur',
        'decay',
        'c_local_pheromone',
        'init_pheromone_value'])

    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize(problem)

    def initialize(self, problem):
        self.pheromones = np.full((problem.machine_count, problem.job_count, problem.job_count), self.config.init_pheromone_value)
        self.best_solution = generate_random_solution(problem)

    def iterate(self):
        for _ in range(self.config.num_ants):
            candidate = construct_solution(self.problem, self.pheromones, self.config.c_greedy, self.config.c_hist, self.config.c_heur)

            if candidate.makespan < self.best_solution.makespan:
                self.best_solution = candidate

            update_pheromones_local(self.problem, self.pheromones, candidate, self.config.c_local_pheromone, self.config.init_pheromone_value)

        update_pheromones_global(self.problem, self.pheromones, self.best_solution, self.config.decay)

        return self.best_solution.makespan

if __name__ == '__main__':
    def run_aco(aco):
        return aco.iterate()

    problem = parse_problem_file(sys.argv[1])

    instances = 12

    acos = [AntColonyOptimizer(
            AntColonyOptimizer.Config(
                num_ants             = 200,
                c_greedy             = 0.5,
                c_hist               = 2.5,
                c_heur               = 0.5,
                decay                = 0.2,
                c_local_pheromone    = 0.1,
                init_pheromone_value = 0.1),
            problem) for _ in range(instances)]

    pool = ThreadPool()

    for _ in range(100):
        print(min(pool.map(AntColonyOptimizer.iterate, acos)))


    #tasks   = [(problem) for _ in range(12)]
    # result = pool.apply_async(AntColonyOptimizer.iterate, , callback=wat)
    # result.wait()

    # for result in results:
    #     result.wait()

    # for i, result in enumerate(results):
    #     result = result.get()
    #     print('{}/{} {}'.format(i + 1, len(results), result))
    
    pool.close()
    pool.join()
