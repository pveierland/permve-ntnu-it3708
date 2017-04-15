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
        self.positions  = [jssp.utility.generate_random_solution(self.problem) for _ in range(self.config.swarm_size)]
        self.velocities = np.full((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), False, bool)
        self.pbest      = self.positions.copy()
        self.gbest      = min(self.pbest, key=lambda solution: solution.makespan)

    def iterate(self):
        for k in range(self.config.swarm_size):
            self.update_particle_velocity(k)

        for k in range(self.config.swarm_size):
            self.update_particle_position(k)
            self.update_particle_tracking(self.positions[k])

        return self.gbest

    def update_particle_position(self, index):
        position = [list(machine_schedule) for machine_schedule in self.positions[index].schedule]
        velocity = self.velocities[index]
        pbest    = self.pbest[index]

        for machine in range(self.problem.machine_count):
            l_start = random.randrange(self.problem.job_count)

            position_machine = position[machine]
            velocity_machine = velocity[machine]
            pbest_machine    = pbest.schedule[machine]
            gbest_machine    = self.gbest.schedule[machine]

            for machine_sequence_index in range(self.problem.job_count):
                l   = (l_start + machine_sequence_index) % self.problem.job_count
                r   = random.random()
                O_1 = position_machine[l]

                if r <= self.config.c1:
                    l_prime = next(operation_index for operation_index, operation in enumerate(pbest_machine) if operation.job == O_1.job)
                    O_2     = position_machine[l_prime]

                    if not velocity_machine[O_1.job] and not velocity_machine[O_2.job] and O_1.job != O_2.job:
                        position_machine[l]       = O_2
                        position_machine[l_prime] = O_1
                        velocity_machine[O_1.job] = True
                elif r <= self.config.c1 + self.config.c2:
                    l_prime = next(operation_index for operation_index, operation in enumerate(gbest_machine) if operation.job == O_1.job)
                    O_2     = position_machine[l_prime]

                    if not velocity_machine[O_1.job] and not velocity_machine[O_2.job] and O_1.job != O_2.job:
                        position_machine[l]       = O_2
                        position_machine[l_prime] = O_1
                        velocity_machine[O_1.job] = True

        schedule, allocations, makespan = jssp.utility.develop_schedule(self.problem, position)
        moves = jssp.utility.find_neighborhood_moves(self.problem, allocations, makespan)

        if moves:
            move     = random.choice(moves)
            schedule = jssp.utility.apply_move(self.problem, schedule, move)
            makespan = jssp.utility.compute_makespan(self.problem, schedule)

            first_operation  = self.problem.operations[move[0]]
            second_operation = self.problem.operations[move[1]]
            velocity[first_operation.machine][first_operation.job]   = True
            velocity[second_operation.machine][second_operation.job] = True

        self.positions[index] = jssp.types.Solution(schedule, makespan)

    def update_particle_velocity(self, velocity_index):
        self.velocities[velocity_index] = np.logical_and(
            self.velocities[velocity_index], np.random.rand(self.problem.machine_count, self.problem.job_count) < self.config.w)

    def update_particle_tracking(self, particle):
        pbest_worst_index = max((entry.makespan, pbest_index) for pbest_index, entry in enumerate(self.pbest))[1]

        if particle.makespan < self.gbest.makespan:
            self.pbest[pbest_worst_index] = self.gbest
            self.gbest                    = particle
        elif particle.makespan == self.gbest.makespan:
            self.gbest = particle
        elif particle.makespan <= self.pbest[pbest_worst_index].makespan:
            for k in range(self.config.swarm_size):
                if particle.makespan == self.pbest[k].makespan:
                    self.pbest[k] = particle
                    break
            else:
                self.pbest[pbest_worst_index] = particle