#!/usr/bin/env python3

import argparse
from collections import namedtuple
import copy
import math
import matplotlib.animation as animation
import matplotlib.pyplot as plt
import random
import statistics
import sys
import json

import numpy as np

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

Allocation = namedtuple('Allocation', ['job_index', 'sequence_index', 'start_time', 'time_steps'])
Operation  = namedtuple('Operation', ['job_index', 'machine_index', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])

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

    job_indexes        = ranks % problem.job_count
    sequence_indexes   = np.zeros(problem.job_count, int)
    operation_sequence = []

    for job_index in job_indexes:
        sequence_index = sequence_indexes[job_index]
        sequence_indexes[job_index] += 1 

        operation = problem.jobs[job_index][sequence_index]
        operation_sequence.append(operation)

    return operation_sequence

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

class Particle(object):
    def __init__(self):
        self.position = np.random.uniform(args.low_value, args.high_value, dimensions)
        self.velocity = np.random.uniform(args.min_velocity, args.max_velocity, dimensions)
        self.evaluation = evaluator(self.position)

    def update(self, individual_best, global_best):
        r_i = np.random.rand(dimensions)
        r_g = np.random.rand(dimensions)

        self.velocity[:] = np.clip((omega * self.velocity) +
            (args.c1 * r_i * (individual_best.position - self.position)) +
            (args.c2 * r_g * (global_best.position - self.position)),
            args.min_velocity,
            args.max_velocity)

        self.position[:] = self.position + self.velocity
        self.evaluation  = evaluator(self.position)

parser = argparse.ArgumentParser()
parser.add_argument('--problem', type=str)
parser.add_argument('--population_size', type=int, default=40)
parser.add_argument('--low_value', type=float, default=0.0)
parser.add_argument('--high_value', type=float, default=2.0)
parser.add_argument('--min_velocity', type=float, default=-2.0)
parser.add_argument('--max_velocity', type=float, default=+2.0)
parser.add_argument('--c1', type=float, default=2.0)
parser.add_argument('--c2', type=float, default=2.0)
parser.add_argument('--generation_count', type=int, default=30)
parser.add_argument('--omega_start', type=float, default=0.9)
parser.add_argument('--omega_end', type=float, default=0.4)
args = parser.parse_args()

problem = parse_problem_file(args.problem)

evaluator = lambda rk: allocate_operation_sequence(problem, decode_random_key_operation_sequence(problem, rk))[1]

dimensions = problem.job_count * problem.machine_count

swarm            = [Particle() for _ in range(args.population_size)]
best_individuals = [copy.deepcopy(individual) for individual in swarm]
best_global      = copy.deepcopy(min(best_individuals, key=lambda individual: individual.evaluation))

for generation_index in range(1, args.generation_count + 1):
    omega = args.omega_start - generation_index * (args.omega_start - args.omega_end) / args.generation_count

    for individual, best_individual in zip(swarm, best_individuals):
        individual.update(best_individual, best_global)

        if individual.evaluation < best_individual.evaluation:
            best_individual.position[:] = individual.position
            best_individual.velocity[:] = individual.velocity
            best_individual.evaluation  = individual.evaluation

            if individual.evaluation < best_global.evaluation:
                best_global.position[:] = individual.position
                best_global.velocity[:] = individual.velocity
                best_global.evaluation  = individual.evaluation

    #print('{} {}'.format(generation_index, best_global.evaluation))

with open('_scores', 'w') as output_file:
    print(json.dumps({'_scores': { 'makespan': best_global.evaluation }}), file=output_file)

#     #values.append(statistics.mean(np.linalg.norm(mpso.individual_velocities[i]) for i in range(mpso.config.population_size)))
#     values.append(sum(np.std(mpso.individual_positions[:,i]) for i in range(mpso.config.dimensions)))

# allocations, makespan = allocate_operation_sequence(problem, decode_random_key_operation_sequence(problem, best_global.position))
# print('final best: {} {}'.format(makespan, best_global.position))
# render_gantt_chart('wtf.pdf', allocations)

# plt.plot(list(range(1, generation_count + 1)), values)

# plt.grid(True)
# plt.draw()
# plt.show()
