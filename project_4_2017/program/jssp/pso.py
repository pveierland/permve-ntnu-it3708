from collections import namedtuple
import numpy as np
import random

import jssp.types
import jssp.utility

Config = namedtuple('Config', [
    'swarm_size',
    'c1',
    'c2',
    'w'])

class Optimizer(object):
    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def initialize(self):
        self.num_operations = self.problem.job_count * self.problem.machine_count
        self.positions      = np.zeros((self.config.swarm_size, self.num_operations), int)

        self.operation_lookup = {
            operation.index: operation
            for operation_sequence in self.problem.jobs
            for operation in operation_sequence}

        for k in range(self.config.swarm_size):
            self.positions[k] = np.random.permutation(self.num_operations)

        self.velocities = np.full((self.config.swarm_size, self.num_operations), False, bool)

        self.pbest_operations = self.positions.copy()
        self.pbest_makespans  = np.zeros(self.config.swarm_size)

        for k in range(self.config.swarm_size):
            self.pbest_makespans[k] = jssp.utility.compute_makespan(self.problem, self.operation_indexes_to_objects(self.pbest_operations[k]))

        gbest_index = np.argmin(self.pbest_makespans)
        self.gbest_operations = self.pbest_operations[gbest_index].copy()
        self.gbest_makespan   = self.pbest_makespans[gbest_index]

    def iterate(self):
        for k in range(self.config.swarm_size):
            self.update_particle_velocity(self.velocities[k])

        for k in range(self.config.swarm_size):
            particle_makespan = self.update_particle_position(self.positions[k], self.velocities[k], self.pbest_operations[k], self.gbest_operations)
            self.update_particle_tracking(k, self.positions[k], particle_makespan)

        return jssp.types.Solution(self.gbest_operations, self.gbest_makespan)

    # def mutate_particle(self, position, velocity):
    #     machine_index = random.randrange(self.problem.machine_count)
    #     first_index   = random.randrange(self.problem.job_count)
    #     second_index  = random.randrange(self.problem.job_count)

    #     first_job  = position[machine_index, first_index]
    #     second_job = position[machine_index, second_index]

    #     position[machine_index, second_index] = first_job
    #     position[machine_index, first_index]  = second_job

    #     velocity[machine_index, first_job]  = True
    #     velocity[machine_index, second_job] = True

    def objects_to_operation_indexes(self, objects):
        return [operation.index for operation in objects]

    def operation_indexes_to_objects(self, indexes):
        return [self.operation_lookup[index] for index in indexes]

    def update_particle_position(self, position, velocity, pbest_operations, gbest_operations):
        l_start = random.randrange(self.num_operations)

        for operation_sequence_index in range(self.num_operations):
            l = (l_start + operation_sequence_index) % self.num_operations
            r = random.random()

            if r <= self.config.c1:
                J_1     = position[l]
                l_prime = pbest_operations.tolist().index(J_1)
                J_2     = position[l_prime]

                if not velocity[J_1] and not velocity[J_2] and J_1 != J_2:
                    position[l]       = J_2
                    position[l_prime] = J_1
                    velocity[J_1]     = True
            elif r <= self.config.c1 + self.config.c2:
                J_1     = position[l]
                l_prime = gbest_operations.tolist().index(J_1)
                J_2     = position[l_prime]

                if not velocity[J_1] and not velocity[J_2] and J_1 != J_2:
                    position[l]       = J_2
                    position[l_prime] = J_1
                    velocity[J_1]     = True

        solution, swapped_operations = jssp.utility.apply_local_search(
            self.problem, self.operation_indexes_to_objects(position))

        if swapped_operations:
            velocity[swapped_operations[0]] = True
            velocity[swapped_operations[1]] = True

        position[:] = self.objects_to_operation_indexes(solution.operations)

        return solution.makespan

    def update_particle_velocity(self, velocity):
        velocity[:] = np.logical_and(velocity, np.random.rand(self.num_operations) < self.config.w)

    def update_particle_tracking(self, index, operations, makespan):
        pbest_worst_index = np.argmax(self.pbest_makespans)

        if makespan < self.gbest_makespan:
            self.pbest_operations[pbest_worst_index] = self.gbest_operations
            self.pbest_makespans[pbest_worst_index]  = self.gbest_makespan
            self.gbest_operations[:] = operations
            self.gbest_makespan      = makespan
        elif makespan == self.gbest_makespan:
            self.gbest_operations[:] = operations
            self.gbest_makespan      = makespan
        elif makespan <= self.pbest_makespans[pbest_worst_index]:
            the_same = False

            for k in range(self.config.swarm_size):
                if makespan == self.pbest_makespans[k]:
                    self.pbest_operations[k] = operations
                    self.pbest_makespans[k]  = makespan
                    the_same = True
                    break

            if not the_same:
                self.pbest_operations[pbest_worst_index] = operations
                self.pbest_makespans[pbest_worst_index]  = makespan