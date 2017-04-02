#!/usr/bin/env python3

from collections import namedtuple
import argparse
import math
import matplotlib.animation as animation
import matplotlib.pyplot as plt
import random
import statistics
import sys

import numpy as np

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

Allocation = namedtuple('Allocation', ['job_index', 'sequence_index', 'start_time', 'time_steps'])
Operation  = namedtuple('Operation', ['job_index', 'machine_index', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])

class MultitypeIndividualEnchancement(object):
    Config = namedtuple('Config', [
        'p_swap',
        'p_insert',
        'p_invert',
        'p_move'])

    def __init__(self, config, evaluator):
        self.swap_threshold   = config.p_swap
        self.insert_threshold = config.p_swap + config.p_insert
        self.invert_threshold = self.insert_threshold + config.p_invert
        self.evaluator        = evaluator

    def enchance(self, sequence):
        q = random.random()
        if q < self.swap_threshold:
            individual_enchancement_swap(sequence)
        elif q < self.insert_threshold:
            individual_enchancement_insert(sequence)
        elif q < self.invert_threshold:
            individual_enchancement_invert(sequence)
        else:
            individual_enchancement_move(sequence)

    def simulated_annealing(self, sequence, start_temperature, final_temperature, cooling_rate):
        evaluation = self.evaluator(sequence)
        successor  = sequence.copy()

        temperature = start_temperature

        while temperature > final_temperature:
            successor[:] = sequence
            self.enchance(successor)
            successor_evaluation = self.evaluator(successor)

            delta = successor_evaluation - evaluation

            if delta < 0 or random.random() < min(1, math.exp(-delta / temperature)):
                sequence[:] = successor
                evaluation  = successor_evaluation
            
            temperature = cooling_rate * temperature

        return evaluation

class MultitypeIndividualEnchancementParticleSwarmOptimizer(object):
    Config = namedtuple('Config', [
        'dimensions',
        'population_size',
        'low_value',
        'high_value',
        'max_velocity',
        'phi_particle',
        'phi_global',
        'p_mie',
        'final_temperature',
        'cooling_rate'])

    def __init__(self, config, mie, evaluator):
        self.config    = config
        self.mie       = mie
        self.evaluator = evaluator

        self.individual_positions = np.random.uniform(
            config.low_value, config.high_value, (config.population_size, config.dimensions))

        self.individual_velocities = np.random.uniform(
            -config.max_velocity, config.max_velocity, (config.population_size, config.dimensions))

        self.individual_evaluations = np.zeros(config.population_size)

        for i in range(self.config.population_size):
            self.individual_evaluations[i] = self.evaluator(self.individual_positions[i])

        self.individual_best_positions   = self.individual_positions.copy()
        self.individual_best_evaluations = self.individual_evaluations.copy()

        self.global_best_position   = np.zeros(config.dimensions)
        self.global_best_evaluation = float('inf')

        for i in range(self.config.population_size):
            if self.individual_best_evaluations[i] < self.global_best_evaluation:
                self.global_best_position[:] = self.individual_best_positions[i]
                self.global_best_evaluation  = self.individual_best_evaluations[i]

    def evolve(self, omega):
        for i in range(self.config.population_size):
            if random.random() < self.config.p_mie:
                start_temperature = abs(self.individual_evaluations[i] - self.global_best_evaluation)

                self.individual_evaluations[i] = self.mie.simulated_annealing(
                    self.individual_positions[i],
                    start_temperature,
                    self.config.final_temperature,
                    self.config.cooling_rate)

                # random_velocity = np.random.rand(self.config.dimensions)
                # random_velocity_magnitude = np.linalg.norm(random_velocity)
                # self.individual_velocities[i] = (np.random.uniform(0.0, self.config.max_velocity)
                #     * (random_velocity / random_velocity_magnitude))

            if self.individual_evaluations[i] < self.individual_best_evaluations[i]:
                self.individual_best_positions[i]   = self.individual_positions[i]
                self.individual_best_evaluations[i] = self.individual_evaluations[i]

                if self.individual_evaluations[i] < self.global_best_evaluation:
                    self.global_best_position[:] = self.individual_positions[i]
                    self.global_best_evaluation  = self.individual_evaluations[i]

        for i in range(self.config.population_size):
            r_p = np.random.rand(self.config.dimensions)
            r_g = np.random.rand(self.config.dimensions)

            position = self.individual_positions[i]

            velocity = np.clip((omega * self.individual_velocities[i]) +
                (self.config.phi_particle * r_p * (self.individual_best_positions[i] - position)) +
                (self.config.phi_global   * r_g * (self.global_best_position - position)),
                -self.config.max_velocity,
                +self.config.max_velocity)

            position   = np.clip(position + velocity, self.config.low_value, self.config.high_value)
            evaluation = self.evaluator(position)

            self.individual_positions[i]   = position
            self.individual_velocities[i]  = velocity
            self.individual_evaluations[i] = evaluation

            if self.individual_evaluations[i] < self.individual_best_evaluations[i]:
                self.individual_best_positions[i]   = self.individual_positions[i]
                self.individual_best_evaluations[i] = self.individual_evaluations[i]

                if self.individual_evaluations[i] < self.global_best_evaluation:
                    self.global_best_position[:] = self.individual_positions[i]
                    self.global_best_evaluation  = self.individual_evaluations[i]

def allocate_operation_sequence(problem, operation_sequence):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    sequence_indexes         = np.zeros(problem.job_count, int)

    allocations = [[] for _ in range(problem.machine_count)]

    for operation in operation_sequence:
        operation_start_time = max(job_completion_times[operation.job_index],
                                   machine_completion_times[operation.machine_index])

        operation_completion_time = operation_start_time + operation.time_steps

        job_completion_times[operation.job_index]         = operation_completion_time
        machine_completion_times[operation.machine_index] = operation_completion_time

        allocations[operation.machine_index].append(
            Allocation(operation.job_index,
                       sequence_indexes[operation.job_index],
                       operation_start_time,
                       operation.time_steps))

        sequence_indexes[operation.job_index] += 1

    return allocations, max(machine_completion_times)

def decode_random_key_operation_sequence(problem, random_key):
    ranks = np.empty(problem.job_count * problem.machine_count, int)
    ranks[random_key.argsort()] = np.arange(problem.job_count * problem.machine_count)

    job_indexes        = (ranks + 1) % problem.job_count
    sequence_indexes   = np.zeros(problem.job_count, int)
    operation_sequence = []

    for job_index in job_indexes:
        sequence_index = sequence_indexes[job_index]
        sequence_indexes[job_index] += 1

        operation = problem.jobs[job_index][sequence_index]
        operation_sequence.append(operation)

    return operation_sequence

def individual_enchancement_insert(sequence):
    original        = sequence.copy()
    sequence_length = len(original)
    source          = random.randrange(sequence_length)
    target          = random.randrange(sequence_length)
    value           = original[source]

    if target < source:
        sequence[target+1:source+1] = original[target:source]
    else:
        sequence[source:target] = original[source+1:target+1]

    sequence[target] = value

def individual_enchancement_invert(sequence):
    sequence_length      = len(sequence)
    first                = random.randrange(sequence_length)
    second               = random.randrange(sequence_length)
    low, high            = min(first, second), max(first, second)
    sequence[low:high+1] = np.flipud(sequence[low:high+1])

def individual_enchancement_move(sequence):
    original = sequence.copy()
    values   = sorted(random.sample(range(len(original)), 3))

    if random.random() < 0.5:
        target, low, high = values
    else:
        low, high, target = values

    length = high - low + 1

    if target < low:
        sequence[target+length:high+1] = original[target:low]
        sequence[target:target+length] = original[low:high+1]
    else:
        sequence[low:target-length+1]      = original[high+1:target+1]
        sequence[target-length+1:target+1] = original[low:high+1]

def individual_enchancement_swap(sequence):
    sequence_length = len(sequence)
    first           = random.randrange(sequence_length)
    second          = random.randrange(sequence_length)
    sequence[first], sequence[second] = sequence[second], sequence[first]

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

# parser = argparse.ArgumentParser()
# parser.add_argument('--problem', type=str)
# parser.add_argument('--population_size', type=int, default=40)
# parser.add_argument('--low_value', type=float, default=0.0)
# parser.add_argument('--high_value', type=float, default=2.0)
# parser.add_argument('--c1', type=float, default=2.0)
# parser.add_argument('--c2', type=float, default=2.0)
# parser.add_argument('--mie', type=float, default=0.01)
# parser.add_argument('--generation_count', type=int, default=30)
# parser.add_argument('--omega_start', type=float, default=0.9)
# parser.add_argument('--omega_end', type=float, default=0.4)
# args = parser.parse_args()

# problem = parse_problem_file(args.problem)

# evaluator = lambda rk: allocate_operation_sequence(problem, decode_random_key_operation_sequence(problem, rk))[1]

# mpso = MultitypeIndividualEnchancementParticleSwarmOptimizer(
#     MultitypeIndividualEnchancementParticleSwarmOptimizer.Config(
#         dimensions        = problem.job_count * problem.machine_count,
#         population_size   = args.population_size,
#         low_value         = 1.0,
#         high_value        = float(problem.job_count * problem.machine_count),
#         max_velocity      = 0.1 * float(problem.job_count * problem.machine_count),
#         phi_particle      = args.c1,
#         phi_global        = args.c2,
#         p_mie             = args.mie,
#         final_temperature = 0.1,
#         cooling_rate      = 0.97),
#     MultitypeIndividualEnchancement(
#         MultitypeIndividualEnchancement.Config(
#             p_swap=0.4,
#             p_insert=0.4,
#             p_invert=0.1,
#             p_move=0.1),
#         evaluator),
#     evaluator)

# generation_count = 500
# omega_start      = 1.4
# omega_end        = 0.4

# values = []

# for generation_index in range(1, generation_count + 1):
#     omega = omega_start - generation_index * (omega_start - omega_end) / generation_count
#     mpso.evolve(omega)
#     #print('{} {}'.format(generation_index, mpso.global_best_evaluation))

# print(mpso.global_best_evaluation)

# for generation_index in range(1, generation_count + 1):
#     omega = omega_start - generation_index * (omega_start - omega_end) / generation_count
#     mpso.evolve(omega)

#     print('{} {}'.format(generation_index, mpso.global_best_evaluation))

#     #values.append(statistics.mean(np.linalg.norm(mpso.individual_velocities[i]) for i in range(mpso.config.population_size)))
#     values.append(sum(np.std(mpso.individual_positions[:,i]) for i in range(mpso.config.dimensions)))

# allocations, makespan = allocate_operation_sequence(problem, decode_random_key_operation_sequence(problem, mpso.global_best_position))
# print('final best: {} {}'.format(makespan, mpso.global_best_position))
# #render_gantt_chart('wtf.pdf', allocations)

# plt.plot(list(range(1, generation_count + 1)), values)

# plt.grid(True)
# plt.draw()
# plt.show()


#import pickle

# with open('data.pickle', 'wb') as f:
#     pickle.dump(mpso.global_best_position, f, pickle.HIGHEST_PROTOCOL)

# with open('data.pickle', 'rb') as f:
#     data = pickle.load(f)

#     x = decode_random_key_operation_sequence(problem, data)
#     xa, xs = allocate_operation_sequence(problem, x)

#     for _ in range(1000):
#         y = decode_random_key_operation_sequence(problem, data)
#         ya, ys = allocate_operation_sequence(problem, y)

#         if not np.array_equal(x, y):
#             print('rk mismatch')

#         if xs != ys:
#             print('makespan mismatch')


# class MultitypeIndividualEnchancementParticleSwarmOptimizerAnimator(object):
#     def __init__(self, mpso, generation_count, omega_start, omega_end):
#         self.mpso             = mpso
#         self.generation_count = generation_count
#         self.omega_start      = omega_start
#         self.omega_end        = omega_end
#         self.fig, self.ax     = plt.subplots()

#         self.ani = animation.FuncAnimation(
#             self.fig, self.update, frames=self.generation_count, init_func=self.setup_plot, blit=True)

#         self.d0 = 0
#         self.d1 = 1

#     def setup_plot(self):
#         self.scatter = self.ax.scatter([self.mpso.individual_positions[0][self.d0]], [self.mpso.individual_positions[0][self.d1]], color='blue')
#         self.scatter_global_best = self.ax.scatter([self.mpso.global_best_position[self.d0]], [self.mpso.global_best_position[self.d1]], color='red')
#         self.scatter_individual_best = self.ax.scatter([self.mpso.individual_best_positions[0][self.d0]], [self.mpso.individual_best_positions[0][self.d1]], color='green')
#             #self.mpso.individual_positions[:,0], self.mpso.individual_positions[:,1], animated=True)

#         return self.scatter, self.scatter_global_best, self.scatter_individual_best

#     def show(self):
#         plt.show()

#     def update(self, i):
#         #print('{} {} {}'.format(i, str(self.mpso.global_best_position), self.mpso.global_best_evaluation))
#         #print(self.mpso.individual_velocities[0])
#         #print(self.mpso.global_best_evaluation)
#         omega = self.omega_start - i * (self.omega_start - self.omega_end) / self.generation_count
#         omega = 0.9
#         self.mpso.evolve(omega)

#         print('{} {} {}'.format(self.mpso.individual_evaluations[0], self.mpso.individual_best_evaluations[0], self.mpso.global_best_evaluation))

#         self.scatter.set_offsets(
#             ([self.mpso.individual_positions[0][self.d0]], [self.mpso.individual_positions[0][self.d1]]))
#             #np.vstack((self.mpso.individual_positions[:,0], self.mpso.individual_positions[:,1])))
#         self.scatter_global_best.set_offsets(
#             ([self.mpso.global_best_position[self.d0]], [self.mpso.global_best_position[self.d1]]))
#         self.scatter_individual_best.set_offsets(
#             ([self.mpso.individual_best_positions[0][self.d0]], [self.mpso.individual_best_positions[0][self.d1]]))

#         self.ax.set_xlim(0.0, float(problem.machine_count * problem.job_count))
#         self.ax.set_ylim(0.0, float(problem.machine_count * problem.job_count))

#         return self.scatter, self.scatter_global_best, self.scatter_individual_best

# mpso_animator = MultitypeIndividualEnchancementParticleSwarmOptimizerAnimator(mpso, generation_count, omega_start, omega_end)
# mpso_animator.show()