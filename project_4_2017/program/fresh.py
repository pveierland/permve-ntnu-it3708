#!/usr/bin/env python3

from collections import namedtuple
import numpy as np
import random
import sys

Allocation = namedtuple('Allocation', ['sequence', 'start_time', 'operation'])
Operation  = namedtuple('Operation', ['job', 'machine', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])

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

    schedule    = np.full((problem.machine_count, problem.job_count), -1)
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

class PermutationParticleSwarmOptimizer(object):
    Config = namedtuple('Config', [
        'swarm_size',
        'c1',
        'c2',
        'w'])

    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def initialize(self):
        self.positions = np.zeros((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), int)

        for k in range(self.config.swarm_size):
            for m in range(self.problem.machine_count):
                self.positions[k, m] = np.random.permutation(self.problem.job_count)

        self.velocities = np.full((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), False, bool)

        self.pbest = []
        for k in range(self.config.swarm_size):
            schedule, _, makespan = develop_schedule(self.problem, self.positions[k])
            self.pbest.append((makespan, schedule))

        self.pbest.sort(key=lambda ms: ms[0])
        self.gbest = self.pbest[0]

    def iterate(self):
        for k in range(self.config.swarm_size):
            self.update_particle_velocity(self.velocities[k])

        for k in range(self.config.swarm_size):
            self.update_particle_position(self.positions[k], self.velocities[k], self.pbest[k][1], self.gbest[1])
            particle_schedule, _, particle_makespan = develop_schedule(self.problem, self.positions[k])
            self.update_particle_tracking(k, particle_schedule, particle_makespan)

    def mutate_particle(self, position, velocity):
        machine_index = random.randrange(self.problem.machine_count)
        first_index   = random.randrange(self.problem.job_count)
        second_index  = random.randrange(self.problem.job_count)

        first_job  = position[machine_index, first_index]
        second_job = position[machine_index, second_index]

        position[machine_index, second_index] = first_job
        position[machine_index, first_index]  = second_job

        velocity[machine_index, first_job]  = True
        velocity[machine_index, second_job] = True

    def update_particle_position(self, position, velocity, pbest_schedule, gbest_schedule):
        for machine in range(self.problem.machine_count):
            l_start = random.randrange(self.problem.job_count)

            for machine_sequence_index in range(self.problem.job_count):
                l = (l_start + machine_sequence_index) % self.problem.job_count
                r = random.random()

                if r <= self.config.c1:
                    J_1     = position[machine, l]
                    l_prime = pbest_schedule[machine].tolist().index(J_1)
                    J_2     = position[machine, l_prime]

                    if not velocity[machine, J_1] and not velocity[machine, J_2] and J_1 != J_2:
                        position[machine, l]       = J_2
                        position[machine, l_prime] = J_1
                        velocity[machine, J_1]     = True
                elif r <= self.config.c1 + self.config.c2:
                    J_1     = position[machine, l]
                    l_prime = gbest_schedule[machine].tolist().index(J_1)
                    J_2     = position[machine, l_prime]

                    if not velocity[machine, J_1] and not velocity[machine, J_2] and J_1 != J_2:
                        position[machine, l]       = J_2
                        position[machine, l_prime] = J_1
                        velocity[machine, J_1]     = True

        self.mutate_particle(position, velocity)

    def update_particle_velocity(self, velocity):
        velocity[:] = np.logical_and(velocity, np.random.rand(self.problem.machine_count, self.problem.job_count) < self.config.w)

    def update_particle_tracking(self, index, schedule, makespan):
        if makespan < self.gbest[0]:
            self.pbest[-1] = self.gbest
            self.gbest     = (makespan, schedule)
        elif makespan == self.gbest[0]:
            self.gbest = (makespan, schedule)
        elif makespan <= self.pbest[-1][0]:
            the_same = False

            for k in range(self.config.swarm_size):
                if makespan == self.pbest[k][0]:
                    self.pbest[k] = (makespan, schedule)
                    the_same = True
                    break

            if not the_same:
                self.pbest[-1] = (makespan, schedule)

        self.pbest.sort(key=lambda ms: ms[0])

problem = parse_problem_file(sys.argv[1])

ppso = PermutationParticleSwarmOptimizer(
    PermutationParticleSwarmOptimizer.Config(
        swarm_size=100,
        c1=0.5,
        c2=0.3,
        w=0.5),
    problem)

try:
    for i in range(100000):
        ppso.iterate()
        print('{} {}'.format(i, ppso.gbest[0]))
except KeyboardInterrupt:
    pass
finally:
    pass