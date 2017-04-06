#!/usr/bin/env python3

from collections import namedtuple
import argparse
from multiprocessing.pool import ThreadPool
import numpy as np
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

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

def render_gantt_chart(output_filename, allocations):
    if not allocations:
        allocations = [
            [Allocation(0, 1, 6, 3), Allocation(3, 1, 13, 5), Allocation(2, 3, 18, 9), Allocation(5, 3, 28, 10), Allocation(1, 4, 38, 10), Allocation(4, 4, 48, 3)],
            [Allocation(1, 0, 0, 8), Allocation(3, 0, 8, 5), Allocation(5, 0, 13, 3), Allocation(0, 2, 16, 6), Allocation(4, 1, 22, 3), Allocation(2, 4, 27, 1)],
            [Allocation(2, 0, 0, 5), Allocation(0, 0, 5, 1), Allocation(1, 1, 8, 5), Allocation(4, 0, 13, 9), Allocation(3, 2, 22, 5), Allocation(5, 5, 49, 1)],
            [Allocation(2, 1, 5, 4), Allocation(5, 1, 16, 3), Allocation(3, 3, 27, 3), Allocation(0, 3, 30, 7), Allocation(1, 5, 48, 4), Allocation(4, 5, 52, 1)],
            [Allocation(1, 2, 13, 10), Allocation(4, 2, 25, 5), Allocation(3, 4, 30, 8), Allocation(2, 5, 38, 7), Allocation(5, 4, 45, 4), Allocation(0, 5, 49, 6)],
            [Allocation(2, 2, 9, 8), Allocation(5, 2, 19, 9), Allocation(1, 3, 28, 10), Allocation(0, 4, 38, 3), Allocation(4, 3, 41, 4), Allocation(3, 5, 45, 9)]]

    configuration = {
        'block_height_ratio': 0.7,
        'bottom_margin': 1.5,
        'box_line_thickness': 0.05,
        'cell_height': 4.0,
        'left_margin': 2.5,
        'major_grid_line_text_spacing': 1.5,
        'major_grid_resolution': 5,
        'major_line_thickness': 0.05,
        'minor_line_thickness': 0.03,
        'right_margin': 1.0,
        'top_margin': 0.5
    }

    colors = {
        'box_line':   QColor(51, 51, 51),
        'major_line': QColor(51, 51, 51, 200),
        'minor_line': QColor(51, 51, 51, 100),
        'path':       QColor(51, 51, 51),
        'text':       QColor(60, 60, 60)
    }

    # http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
    job_colors = [QColor(c) for c in ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f']]

    num_machines = len(allocations)

    max_time_step = max(allocation.start_time + allocation.time_steps
                        for machine_allocations in allocations
                        for allocation in machine_allocations)

    width  = int(math.ceil(max_time_step / configuration['major_grid_resolution']) * configuration['major_grid_resolution'])
    height = num_machines * configuration['cell_height']

    app = QApplication([ '-platform', 'offscreen'])

    printer = QPrinter()
    printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(output_filename)
    printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)

    printer.setPageSize(QPageSize(
        QSizeF(width  + configuration['left_margin'] + configuration['right_margin'],
               height + configuration['top_margin']  + configuration['bottom_margin']),
        QPageSize.Inch))

    painter = QPainter(printer)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setRenderHint(QPainter.HighQualityAntialiasing)
    painter.scale(printer.resolution(), printer.resolution())
    painter.translate(configuration['left_margin'], configuration['top_margin'])

    regular_font = painter.font()
    regular_font.setPixelSize(1)
    painter.setFont(regular_font)

    bold_font = painter.font()
    bold_font.setWeight(QFont.DemiBold)

    major_grid = QPainterPath()
    minor_grid = QPainterPath()

    painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

    for x in range(width + 1):
        is_major_grid_line = x % configuration['major_grid_resolution'] == 0
        grid = major_grid if is_major_grid_line else minor_grid
        grid.moveTo(float(x), 0.0)
        grid.lineTo(float(x), height)

        if is_major_grid_line:
            major_grid_line_text = str(x)
            major_grid_line_text_rect = painter.fontMetrics().boundingRect(major_grid_line_text)
            painter.save()
            painter.translate(x - major_grid_line_text_rect.width() / 2.0, height + configuration['major_grid_line_text_spacing'] - major_grid_line_text_rect.height() / 2.0)
            painter.drawText(major_grid_line_text_rect, Qt.AlignCenter, str(x))
            painter.restore()

    for k in range(num_machines + 1):
        y = configuration['cell_height'] * k
        major_grid.moveTo(0.0, y)
        major_grid.lineTo(float(width), y)

    painter.setPen(QPen(colors['minor_line'], configuration['minor_line_thickness']))
    painter.drawPath(minor_grid)

    painter.setPen(QPen(colors['major_line'], configuration['major_line_thickness']))
    painter.drawPath(major_grid)

    for machine_index, machine_allocations in enumerate(allocations):
        machine_text_rect = QRectF(-configuration['left_margin'], configuration['cell_height'] * machine_index, configuration['left_margin'], configuration['cell_height'])
        painter.setFont(bold_font)
        painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))
        painter.drawText(machine_text_rect, Qt.AlignCenter, 'M{}'.format(machine_index + 1))

        for allocation in machine_allocations:
            rect = QRectF(
                float(allocation.start_time),
                (float(machine_index) + (1.0 - configuration['block_height_ratio']) / 2.0) * configuration['cell_height'],
                float(allocation.time_steps),
                configuration['block_height_ratio'] * configuration['cell_height'])

            painter.setPen(QPen(colors['box_line'], configuration['box_line_thickness']))
            painter.fillRect(rect, QBrush(job_colors[allocation.job_index]))
            painter.drawRect(rect)

            text = '({}/{})'.format(allocation.sequence_index + 1, allocation.job_index + 1)
            text_width = painter.fontMetrics().width(text)
            painter.setFont(regular_font)
            painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

            if text_width > 0.8 * rect.width():
                text_rect = rect.translated(QPointF(-0.1, 0.05))
                painter.save()
                painter.translate(text_rect.center())
                painter.rotate(-90)
                painter.scale(0.7, 0.7)
                painter.drawText(QRectF(-text_rect.height() / 2.0, -text_rect.width() / 2.0, text_rect.height(), text_rect.width()), Qt.AlignCenter, text)
                painter.restore()
            else:
                text_rect = rect.translated(QPointF(0.05, -0.15))
                painter.drawText(text_rect, Qt.AlignCenter, text)

    painter.end()

class BeesAlgorithmOptimizer(object):
    Config = namedtuple('Config', [
        'num_scouts',
        'num_normal_sites',
        'num_elite_sites',
        'num_normal_bees',
        'num_elite_bees',])

    def __init__(self, config, problem):
        self.config  = config
        self.problem = problem

        self.initialize()

    def initialize(self):
        self.site_preferences = np.zeros((self.config.num_scouts, self.problem.machine_count, self.problem.job_count), int)
        self.site_makespans   = np.zeros(self.config.num_scouts)

        for k in range(self.config.num_scouts):
            for m in range(self.problem.machine_count):
                self.site_preferences[k, m] = np.random.permutation(self.problem.job_count)

            _, _, self.site_makespans[k] = develop_schedule(self.problem, self.site_preferences[k])

        self.next_site_preferences = self.site_preferences.copy()
        self.next_site_makespans   = self.site_makespans.copy()

    def iterate(self):
        sorted_site_indexes = np.argsort(self.site_makespans)

        for es in range(self.config.num_elite_sites):
            elite_site_index = sorted_site_indexes[es]

            best_site_preference = self.site_preferences[elite_site_index].copy()
            best_site_makespan   = self.site_makespans[elite_site_index]

            for eb in range(self.config.num_elite_bees):
                elite_site_preference = self.site_preferences[elite_site_index].copy()
                self.mutate_preference(elite_site_preference)
                _, _, elite_site_makespan = develop_schedule(self.problem, elite_site_preference)

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

            for nb in range(self.config.num_normal_bees):
                normal_site_preference = self.site_preferences[normal_site_index].copy()
                self.mutate_preference(normal_site_preference)
                _, _, normal_site_makespan = develop_schedule(self.problem, normal_site_preference)

                if normal_site_makespan < best_site_makespan:
                    best_site_preference = normal_site_preference
                    best_site_makespan   = normal_site_makespan

            self.next_site_preferences[i] = best_site_preference
            self.next_site_makespans[i]   = best_site_makespan

        for k in range(self.config.num_elite_sites + self.config.num_normal_sites, self.config.num_scouts):
            for m in range(self.problem.machine_count):
                self.next_site_preferences[k, m] = np.random.permutation(self.problem.job_count)
            _, _, self.next_site_makespans[k] = develop_schedule(self.problem, self.next_site_preferences[k])

        self.site_preferences, self.next_site_preferences = self.next_site_preferences, self.site_preferences
        self.site_makespans, self.next_site_makespans     = self.next_site_makespans, self.site_makespans

        return min(self.site_makespans)

    def mutate_preference(self, preference):
        machine_index = random.randrange(self.problem.machine_count)
        first_index   = random.randrange(self.problem.job_count)
        second_index  = random.randrange(self.problem.job_count)

        first_job  = preference[machine_index, first_index]
        second_job = preference[machine_index, second_index]

        preference[machine_index, second_index] = first_job
        preference[machine_index, first_index]  = second_job

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

        self.pbest_schedules = np.zeros((self.config.swarm_size, self.problem.machine_count, self.problem.job_count), int)
        self.pbest_makespans = np.zeros(self.config.swarm_size)

        for k in range(self.config.swarm_size):
            self.pbest_schedules[k], _, self.pbest_makespans[k] = develop_schedule(self.problem, self.positions[k])

        gbest_index = np.argmin(self.pbest_makespans)
        self.gbest_schedule = self.pbest_schedules[gbest_index].copy()
        self.gbest_makespan = self.pbest_makespans[gbest_index]

    def iterate(self):
        for k in range(self.config.swarm_size):
            self.update_particle_velocity(self.velocities[k])

        for k in range(self.config.swarm_size):
            self.update_particle_position(self.positions[k], self.velocities[k], self.pbest_schedules[k], self.gbest_schedule)
            particle_schedule, _, particle_makespan = develop_schedule(self.problem, self.positions[k])
            self.update_particle_tracking(k, particle_schedule, particle_makespan)

        return self.gbest_makespan

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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--ba_num_scouts',  type=int, default=100)
    parser.add_argument('--ba_num_normal_sites',  type=int, default=10)
    parser.add_argument('--ba_num_elite_sites',  type=int, default=5)
    parser.add_argument('--ba_num_normal_bees',  type=int, default=5)
    parser.add_argument('--ba_num_elite_bees',  type=int, default=15)
    parser.add_argument('--pso_swarm_size', type=int, default=100)
    parser.add_argument('--pso_c1', type=float, default=0.5)
    parser.add_argument('--pso_c2', type=float, default=0.3)
    parser.add_argument('--pso_w', type=float, default=0.5)
    parser.add_argument('--optimizer', choices=['aco', 'ba', 'pso'], required=True)
    parser.add_argument('--problem', type=str, required=True)

    args = parser.parse_args()

    problem = parse_problem_file(args.problem)

    instances = 12

    if args.optimizer == 'ba':
        optimizer = BeesAlgorithmOptimizer(
            BeesAlgorithmOptimizer.Config(
                num_scouts       = args.ba_num_scouts,
                num_normal_sites = args.ba_num_normal_sites,
                num_elite_sites  = args.ba_num_elite_sites,
                num_normal_bees  = args.ba_num_normal_bees,
                num_elite_bees   = args.ba_num_elite_bees),
            problem)

        for _ in range(1000):
            print(optimizer.iterate())

        sys.exit()
    elif args.optimizer == 'pso':
        # optimizers = [PermutationParticleSwarmOptimizer(
        #     PermutationParticleSwarmOptimizer.Config(
        #         swarm_size = args.pso_swarm_size,
        #         c1         = args.pso_c1,
        #         c2         = args.pso_c2,
        #         w          = args.pso_w),
        #     problem) for _ in range(instances)]

        optimizer = PermutationParticleSwarmOptimizer(
            PermutationParticleSwarmOptimizer.Config(
                swarm_size = args.pso_swarm_size,
                c1         = args.pso_c1,
                c2         = args.pso_c2,
                w          = args.pso_w),
            problem)

        for _ in range(1000):
            print(optimizer.iterate())

        sys.exit()

    try:
        pool = ThreadPool()

        for _ in range(100):
            print(min(pool.map(lambda optimizer: optimizer.iterate(), optimizers)))

        pool.close()
        pool.join()

    except KeyboardInterrupt:
        pass
    finally:
        pass