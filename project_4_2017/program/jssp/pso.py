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
        self.positions = np.zeros((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), int)

        for k in range(self.config.swarm_size):
            for m in range(self.problem.machine_count):
                self.positions[k, m] = np.random.permutation(self.problem.job_count)

        self.velocities = np.full((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), False, bool)

        self.pbest_schedules = np.zeros((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), int)
        self.pbest_makespans = np.zeros(self.config.swarm_size)

        for k in range(self.config.swarm_size):
            self.pbest_schedules[k], _, self.pbest_makespans[k] = jssp.utility.develop_schedule(self.problem, self.positions[k])

        gbest_index = np.argmin(self.pbest_makespans)
        self.gbest_schedule = self.pbest_schedules[gbest_index].copy()
        self.gbest_makespan = self.pbest_makespans[gbest_index]

    def iterate(self):
        for k in range(self.config.swarm_size):
            self.update_particle_velocity(self.velocities[k])

        for k in range(self.config.swarm_size):
            self.update_particle_position(self.positions[k], self.velocities[k], self.pbest_schedules[k], self.gbest_schedule)
            particle_schedule, _, particle_makespan = jssp.utility.develop_schedule(self.problem, self.positions[k])
            self.update_particle_tracking(k, particle_schedule, particle_makespan)

        return jssp.types.Solution(None, self.gbest_makespan)

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

        schedule, allocations, makespan = jssp.utility.develop_schedule(self.problem, position)
        reorderings = jssp.utility.find_reorderings(self.problem, allocations)

        if reorderings:
            position[:], _, _ = jssp.utility.develop_schedule(problem, schedule, random.choice(reorderings))
        else:
            self.mutate_particle(position, velocity)

    def update_particle_velocity(self, velocity):
        velocity[:] = np.logical_and(velocity, np.random.rand(self.problem.machine_count, self.problem.job_count) < self.config.w)

    def update_particle_tracking(self, index, schedule, makespan):
        pbest_worst_index = np.argmax(self.pbest_makespans)

        if makespan < self.gbest_makespan:
            self.pbest_schedules[pbest_worst_index] = self.gbest_schedule
            self.pbest_makespans[pbest_worst_index] = self.gbest_makespan
            self.gbest_schedule[:] = schedule
            self.gbest_makespan    = makespan
        elif makespan == self.gbest_makespan:
            self.gbest_schedule[:] = schedule
            self.gbest_makespan    = makespan
        elif makespan <= self.pbest_makespans[pbest_worst_index]:
            the_same = False

            for k in range(self.config.swarm_size):
                if makespan == self.pbest_makespans[k]:
                    self.pbest_schedules[k] = schedule
                    self.pbest_makespans[k] = makespan
                    the_same = True
                    break

            if not the_same:
                self.pbest_schedules[pbest_worst_index] = schedule
                self.pbest_makespans[pbest_worst_index] = makespan