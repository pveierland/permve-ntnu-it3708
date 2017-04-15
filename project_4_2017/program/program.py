#!/usr/bin/env python3

from collections import namedtuple
from multiprocessing.pool import ThreadPool
import argparse
import math
import numpy as np
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

import jssp.aco
import jssp.ba
import jssp.io
import jssp.pso
import jssp.types
import jssp.utility

# Allocation = namedtuple('Allocation', ['job_sequence_index', 'machine_sequence_index', 'start_time', 'predecessor', 'operation'])
# #Allocation        = namedtuple('Allocation', ['job_sequence_index', 'start_time', 'operation'])
# Operation         = namedtuple('Operation', ['job', 'machine', 'time_steps'])
# Problem           = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])
# Solution          = namedtuple('Solution', ['schedule', 'makespan'])
# Reorder           = namedtuple('Reorder', ['machine', 'machine_sequence_edge', 'machine_sequence_index', 'operation', 'after'])



# def develop_schedule(problem, preference, reorder=None):
#     def compute_earliest_start_time(operation):
#         return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

#     def compute_earliest_completion_time(operation):
#         return compute_earliest_start_time(operation) + operation.time_steps

#     def get_preferred_conflict_operation(conflict_set):
#         for preferred_job in preference[earliest_operation.machine]:
#             for conflict_operation in conflict_set:
#                 if not reorder or not reorder.after or conflict_operation is not reorder.operation:
#                     if preferred_job == conflict_operation.job:
#                         return conflict_operation

#     schedule    = np.full((problem.machine_count, problem.job_count), -1, int)
#     allocations = [[] for _ in range(problem.machine_count)]
#     possible    = [operation_sequence[0] for operation_sequence in problem.jobs]

#     job_completion_times     = np.zeros(problem.job_count)
#     machine_completion_times = np.zeros(problem.machine_count)
#     job_sequence_indexes     = np.zeros(problem.job_count, int)
#     machine_sequence_indexes = np.zeros(problem.machine_count, int)

#     job_allocations     = [None for _ in range(problem.job_count)]
#     machine_allocations = [None for _ in range(problem.machine_count)]

#     while possible:
#         earliest_completion_time, earliest_operation = \
#             min((compute_earliest_completion_time(operation), operation) for operation in possible)

#         conflict_set = [operation for operation in possible
#                         if operation.machine == earliest_operation.machine and
#                         compute_earliest_start_time(operation) < earliest_completion_time]

#         if (reorder and reorder.machine == earliest_operation.machine and
#             ((not reorder.after and
#               reorder.machine_sequence_edge <= machine_sequence_indexes[earliest_operation.machine] and
#               machine_sequence_indexes[earliest_operation.machine] <= reorder.machine_sequence_index and
#               reorder.operation in conflict_set) or
#              (reorder.after and
#               (machine_sequence_indexes[earliest_operation.machine] == reorder.machine_sequence_edge or
#                (len(conflict_set) == 1 and reorder.operation in conflict_set))))):
#             selected_operation = reorder.operation
#             reorder            = None
#         else:
#             selected_operation = get_preferred_conflict_operation(conflict_set)

#         predecessor = (machine_allocations[selected_operation.machine]
#             if machine_completion_times[selected_operation.machine] >= job_completion_times[selected_operation.job]
#             else job_allocations[selected_operation.job])

#         job_sequence_index = job_sequence_indexes[selected_operation.job]
#         job_sequence_indexes[selected_operation.job] += 1

#         machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
#         machine_sequence_indexes[selected_operation.machine] += 1

#         operation_start_time      = compute_earliest_start_time(selected_operation)
#         operation_completion_time = operation_start_time + selected_operation.time_steps

#         job_completion_times[selected_operation.job]         = operation_completion_time
#         machine_completion_times[selected_operation.machine] = operation_completion_time

#         schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

#         allocation = Allocation(job_sequence_index, machine_sequence_index, operation_start_time, predecessor, selected_operation)

#         allocations[selected_operation.machine].append(allocation)

#         job_allocations[selected_operation.job]         = allocation
#         machine_allocations[selected_operation.machine] = allocation

#         if selected_operation in possible:
#             possible.remove(selected_operation)

#         if job_sequence_index < problem.machine_count - 1:
#             possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

#     makespan = max(machine_completion_times)

#     return schedule, allocations, makespan

# def find_reorderings(problem, allocations):
#     head = max((machine_allocation[-1].start_time + machine_allocation[-1].operation.time_steps, machine_allocation[-1])
#                for machine_allocation in allocations)[1]

#     reorderings  = []
#     centerpieces = []

#     left_edge  = None
#     right_edge = None
#     previous   = None

#     while head:
#         if not previous or head.operation.machine != previous.operation.machine:
#             right_edge = head
#             centerpieces.clear()
#         elif not head.predecessor or head.operation.machine != head.predecessor.operation.machine:
#             left_edge = head

#             for centerpiece in centerpieces:
#                 reorderings.append(Reorder(
#                     centerpiece.operation.machine, left_edge.machine_sequence_index, centerpiece.machine_sequence_index, centerpiece.operation, False))
#                 reorderings.append(Reorder(
#                     centerpiece.operation.machine, right_edge.machine_sequence_index, centerpiece.machine_sequence_index, centerpiece.operation, True))
#         else:
#             centerpieces.append(head)

#         previous = head
#         head     = head.predecessor

#     return reorderings

# # def develop_schedule(problem, preference):
# #     def compute_earliest_start_time(operation):
# #         return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

# #     def compute_earliest_completion_time(operation):
# #         return compute_earliest_start_time(operation) + operation.time_steps

# #     def get_preferred_conflict_operation(conflict_set):
# #         for preferred_job in preference[earliest_operation.machine]:
# #             for conflict_operation in conflict_set:
# #                 if preferred_job == conflict_operation.job:
# #                     return conflict_operation

# #     schedule    = np.full((problem.machine_count, problem.job_count), -1, int)
# #     allocations = [[] for _ in range(problem.machine_count)]
# #     possible    = [operation_sequence[0] for operation_sequence in problem.jobs]

# #     job_completion_times     = np.zeros(problem.job_count)
# #     machine_completion_times = np.zeros(problem.machine_count)
# #     job_sequence_indexes     = np.zeros(problem.job_count, int)
# #     machine_sequence_indexes = np.zeros(problem.machine_count, int)

# #     while possible:
# #         earliest_completion_time, earliest_operation = \
# #             min((compute_earliest_completion_time(operation), operation) for operation in possible)

# #         conflict_set = [operation for operation in possible
# #                         if operation.machine == earliest_operation.machine and
# #                         compute_earliest_start_time(operation) < earliest_completion_time]

# #         selected_operation = get_preferred_conflict_operation(conflict_set)

# #         job_sequence_index = job_sequence_indexes[selected_operation.job]
# #         job_sequence_indexes[selected_operation.job] += 1

# #         machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
# #         machine_sequence_indexes[selected_operation.machine] += 1

# #         operation_start_time      = compute_earliest_start_time(selected_operation)
# #         operation_completion_time = operation_start_time + selected_operation.time_steps

# #         job_completion_times[selected_operation.job]         = operation_completion_time
# #         machine_completion_times[selected_operation.machine] = operation_completion_time

# #         schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

# #         allocations[selected_operation.machine].append(
# #             Allocation(job_sequence_index, operation_start_time, selected_operation))

# #         possible.remove(selected_operation)

# #         if job_sequence_index < problem.machine_count - 1:
# #             possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

# #     makespan = max(machine_completion_times)

# #     return schedule, allocations, makespan

# def parse_problem_file(filename):
#     with open(filename) as input_file:
#         input_lines = input_file.readlines()
#         job_count, machine_count = map(int, input_lines[0].split())
#         jobs = []

#         for job_index in range(job_count):
#             input_line = list(map(int, input_lines[job_index + 1].split()))
#             jobs.append([Operation(job_index, machine_index, time_steps)
#                          for machine_index, time_steps in zip(input_line[0::2], input_line[1::2])])

#         return Problem(job_count, machine_count, jobs)

# def render_gantt_chart(output_filename, allocations):
#     if not allocations:
#         allocations = [
#             [Allocation(0, 1, 6, 3), Allocation(3, 1, 13, 5), Allocation(2, 3, 18, 9), Allocation(5, 3, 28, 10), Allocation(1, 4, 38, 10), Allocation(4, 4, 48, 3)],
#             [Allocation(1, 0, 0, 8), Allocation(3, 0, 8, 5), Allocation(5, 0, 13, 3), Allocation(0, 2, 16, 6), Allocation(4, 1, 22, 3), Allocation(2, 4, 27, 1)],
#             [Allocation(2, 0, 0, 5), Allocation(0, 0, 5, 1), Allocation(1, 1, 8, 5), Allocation(4, 0, 13, 9), Allocation(3, 2, 22, 5), Allocation(5, 5, 49, 1)],
#             [Allocation(2, 1, 5, 4), Allocation(5, 1, 16, 3), Allocation(3, 3, 27, 3), Allocation(0, 3, 30, 7), Allocation(1, 5, 48, 4), Allocation(4, 5, 52, 1)],
#             [Allocation(1, 2, 13, 10), Allocation(4, 2, 25, 5), Allocation(3, 4, 30, 8), Allocation(2, 5, 38, 7), Allocation(5, 4, 45, 4), Allocation(0, 5, 49, 6)],
#             [Allocation(2, 2, 9, 8), Allocation(5, 2, 19, 9), Allocation(1, 3, 28, 10), Allocation(0, 4, 38, 3), Allocation(4, 3, 41, 4), Allocation(3, 5, 45, 9)]]

#     configuration = {
#         'block_height_ratio': 0.7,
#         'bottom_margin': 1.5,
#         'box_line_thickness': 0.05,
#         'cell_height': 4.0,
#         'left_margin': 2.5,
#         'major_grid_line_text_spacing': 1.5,
#         'major_grid_resolution': 5,
#         'major_line_thickness': 0.05,
#         'minor_line_thickness': 0.03,
#         'right_margin': 1.0,
#         'top_margin': 0.5
#     }

#     colors = {
#         'box_line':   QColor(51, 51, 51),
#         'major_line': QColor(51, 51, 51, 200),
#         'minor_line': QColor(51, 51, 51, 100),
#         'path':       QColor(51, 51, 51),
#         'text':       QColor(60, 60, 60)
#     }

#     # http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
#     # http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=12
#     job_colors = [QColor(c) for c in [
#         '#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f',
#         '#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']]

#     num_machines = len(allocations)

#     max_time_step = max(allocation.start_time + allocation.operation.time_steps
#                         for machine_allocations in allocations
#                         for allocation in machine_allocations)

#     width  = int(math.ceil(max_time_step / configuration['major_grid_resolution']) * configuration['major_grid_resolution'])
#     height = num_machines * configuration['cell_height']

#     app = QApplication([ '-platform', 'offscreen'])

#     printer = QPrinter()
#     printer.setOutputFormat(QPrinter.PdfFormat)
#     printer.setOutputFileName(output_filename)
#     printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)

#     printer.setPageSize(QPageSize(
#         QSizeF(width  + configuration['left_margin'] + configuration['right_margin'],
#                height + configuration['top_margin']  + configuration['bottom_margin']),
#         QPageSize.Inch))

#     painter = QPainter(printer)
#     painter.setRenderHint(QPainter.Antialiasing)
#     painter.setRenderHint(QPainter.HighQualityAntialiasing)
#     painter.scale(printer.resolution(), printer.resolution())
#     painter.translate(configuration['left_margin'], configuration['top_margin'])

#     regular_font = painter.font()
#     regular_font.setPixelSize(1)
#     painter.setFont(regular_font)

#     bold_font = painter.font()
#     bold_font.setWeight(QFont.DemiBold)

#     major_grid = QPainterPath()
#     minor_grid = QPainterPath()

#     painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

#     for x in range(width + 1):
#         is_major_grid_line = x % configuration['major_grid_resolution'] == 0
#         grid = major_grid if is_major_grid_line else minor_grid
#         grid.moveTo(float(x), 0.0)
#         grid.lineTo(float(x), height)

#         if is_major_grid_line:
#             major_grid_line_text = str(x)
#             major_grid_line_text_rect = painter.fontMetrics().boundingRect(major_grid_line_text)
#             painter.save()
#             painter.translate(x - major_grid_line_text_rect.width() / 2.0, height + configuration['major_grid_line_text_spacing'] - major_grid_line_text_rect.height() / 2.0)
#             painter.drawText(major_grid_line_text_rect, Qt.AlignCenter, str(x))
#             painter.restore()

#     for k in range(num_machines + 1):
#         y = configuration['cell_height'] * k
#         major_grid.moveTo(0.0, y)
#         major_grid.lineTo(float(width), y)

#     painter.setPen(QPen(colors['minor_line'], configuration['minor_line_thickness']))
#     painter.drawPath(minor_grid)

#     painter.setPen(QPen(colors['major_line'], configuration['major_line_thickness']))
#     painter.drawPath(major_grid)

#     for machine_index, machine_allocations in enumerate(allocations):
#         machine_text_rect = QRectF(-configuration['left_margin'], configuration['cell_height'] * machine_index, configuration['left_margin'], configuration['cell_height'])
#         painter.setFont(bold_font)
#         painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))
#         painter.drawText(machine_text_rect, Qt.AlignCenter, 'M{}'.format(machine_index + 1))

#         for allocation in machine_allocations:
#             rect = QRectF(
#                 float(allocation.start_time),
#                 (float(machine_index) + (1.0 - configuration['block_height_ratio']) / 2.0) * configuration['cell_height'],
#                 float(allocation.operation.time_steps),
#                 configuration['block_height_ratio'] * configuration['cell_height'])

#             painter.setPen(QPen(colors['box_line'], configuration['box_line_thickness']))
#             painter.fillRect(rect, QBrush(job_colors[allocation.operation.job % len(job_colors)]))
#             painter.drawRect(rect)

#             text = '({}/{})'.format(allocation.job_sequence_index + 1, allocation.operation.job + 1)
#             text_width = painter.fontMetrics().width(text)
#             painter.setFont(regular_font)
#             painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

#             if text_width > 0.8 * rect.width():
#                 text_rect = rect.translated(QPointF(-0.1, 0.05))
#                 painter.save()
#                 painter.translate(text_rect.center())
#                 painter.rotate(-90)
#                 painter.scale(0.7, 0.7)
#                 painter.drawText(QRectF(-text_rect.height() / 2.0, -text_rect.width() / 2.0, text_rect.height(), text_rect.width()), Qt.AlignCenter, text)
#                 painter.restore()
#             else:
#                 text_rect = rect.translated(QPointF(0.05, -0.15))
#                 painter.drawText(text_rect, Qt.AlignCenter, text)

#     painter.end()





# def generate_random_preference(problem):
#     preference = np.zeros((problem.machine_count, problem.job_count))

#     for m in range(problem.machine_count):
#         preference[m] = np.random.permutation(problem.job_count)

#     return preference

# def generate_random_solution(problem):
#     preference = generate_random_preference(problem)
#     schedule, _, makespan = develop_schedule(problem, preference)
#     return Solution(schedule, makespan)

# def construct_solution(problem, pheromones, c_greedy, c_hist, c_heur):
#     def compute_earliest_start_time(operation):
#         return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

#     def compute_earliest_completion_time(operation):
#         return compute_earliest_start_time(operation) + operation.time_steps

#     schedule    = np.full((problem.machine_count, problem.job_count), -1, int)
#     allocations = [[] for _ in range(problem.machine_count)]
#     possible    = [operation_sequence[0] for operation_sequence in problem.jobs]

#     job_completion_times     = np.zeros(problem.job_count)
#     machine_completion_times = np.zeros(problem.machine_count)
#     job_sequence_indexes     = np.zeros(problem.job_count, int)
#     machine_sequence_indexes = np.zeros(problem.machine_count, int)

#     job_allocations     = [None for _ in range(problem.job_count)]
#     machine_allocations = [None for _ in range(problem.machine_count)]

#     while possible:
#         earliest_completion_time, earliest_operation = \
#             min((compute_earliest_completion_time(operation), operation) for operation in possible)

#         conflict_set = [operation for operation in possible
#                         if operation.machine == earliest_operation.machine and
#                         compute_earliest_start_time(operation) < earliest_completion_time]

#         if random.random() < c_greedy:
#             selected_operation = earliest_operation
#         else:
#             conflict_set_probabilities = [
#                 (pheromones[operation.machine, machine_sequence_indexes[operation.machine], operation.job] ** c_hist) *
#                 ((1.0 / (1.0 + compute_earliest_completion_time(operation) - earliest_completion_time)) ** c_heur)
#                 for operation in conflict_set
#             ]

#             random_selection = sum(conflict_set_probabilities) * random.random()

#             for i, p in enumerate(conflict_set_probabilities):
#                 random_selection -= p
#                 if random_selection < 0:
#                     selected_operation = conflict_set[i]
#                     break
#             else:
#                 selected_operation = conlict_set[-1]

#         predecessor = (machine_allocations[selected_operation.machine]
#             if machine_completion_times[selected_operation.machine] >= job_completion_times[selected_operation.job]
#             else job_allocations[selected_operation.job])

#         job_sequence_index = job_sequence_indexes[selected_operation.job]
#         job_sequence_indexes[selected_operation.job] += 1

#         machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
#         machine_sequence_indexes[selected_operation.machine] += 1

#         operation_start_time      = compute_earliest_start_time(selected_operation)
#         operation_completion_time = operation_start_time + selected_operation.time_steps

#         job_completion_times[selected_operation.job]         = operation_completion_time
#         machine_completion_times[selected_operation.machine] = operation_completion_time

#         schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

#         allocation = Allocation(job_sequence_index, machine_sequence_index, operation_start_time, predecessor, selected_operation)

#         allocations[selected_operation.machine].append(allocation)

#         job_allocations[selected_operation.job]         = allocation
#         machine_allocations[selected_operation.machine] = allocation

#         possible.remove(selected_operation)

#         if job_sequence_index < problem.machine_count - 1:
#             possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

#     makespan = max(machine_completion_times)

#     return schedule, allocations, makespan

# def update_pheromones_local(problem, pheromones, candidate, c_local_pheromone, init_pheromone_value):
#     for m in range(problem.machine_count):
#         for j in range(problem.job_count):
#             selected_job = candidate.schedule[m, j]
#             pheromones[m, j, selected_job] = (1.0 - c_local_pheromone) * pheromones[m, j, selected_job] + c_local_pheromone * init_pheromone_value

# def update_pheromones_global(problem, pheromones, candidate, decay):
#     for m in range(problem.machine_count):
#         for j in range(problem.job_count):
#             selected_job = candidate.schedule[m, j]
#             pheromones[m, j, selected_job] = (1.0 - decay) * pheromones[m, j, selected_job] + decay / candidate.makespan

def run_shit(args):


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--taboo_iteration_limit',    type=int, default=500)
    parser.add_argument('--taboo_list_limit',         type=int, default=8)
    parser.add_argument('--taboo_backtracking_limit', type=int, default=5)
    parser.add_argument('--taboo_max_cycle_duration', type=int, default=100)
    parser.add_argument('--taboo_max_cycle_count',    type=int, default=2)

    parser.add_argument('--ba_num_elite_bees',        type=int,   default=2)
    parser.add_argument('--ba_num_elite_sites',       type=int,   default=2)
    parser.add_argument('--ba_num_normal_bees',       type=int,   default=2)
    parser.add_argument('--ba_num_normal_sites',      type=int,   default=5)
    parser.add_argument('--ba_num_scouts',            type=int,   default=10)
    parser.add_argument('--ba_iterations',            type=int,   default=100)

    parser.add_argument('--aco_evaporation_rate',        type=float, default=0.1)
    parser.add_argument('--aco_beta',                    type=float, default=10.0)
    parser.add_argument('--aco_initial_pheromone_value', type=float, default=0.5)
    parser.add_argument('--aco_tabu_search_tenure',      type=int,   default=10)
    parser.add_argument('--aco_iterations',              type=int,   default=100)

    parser.add_argument('--iterations',               type=int)
    parser.add_argument('--optimizer',                choices=['aco', 'ba', 'pso'], required=True)
    parser.add_argument('--problem',                  type=str,   required=True)

    parser.add_argument('--pso_c1',                   type=float, default=0.5)
    parser.add_argument('--pso_c2',                   type=float, default=0.3)
    parser.add_argument('--pso_swarm_size',           type=int,   default=100)
    parser.add_argument('--pso_w',                    type=float, default=0.5)
    parser.add_argument('--pso_iterations',           type=int,   default=150)

    parser.add_argument('--script',                   action='store_true')
    parser.add_argument('--render',                   action='store_true')
    parser.add_argument('--output_filename',              type=str, default='output.pdf')
    args = parser.parse_args()

    problem = jssp.io.parse_problem_file(args.problem)

    magic = 12

    if args.optimizer == 'aco':
        optimizer = jssp.aco.Optimizer(
            jssp.aco.Config(
                evaporation_rate        = args.aco_evaporation_rate,
                beta                    = args.aco_beta,
                tabu_search_tenure      = args.aco_tabu_search_tenure,
                initial_pheromone_value = args.aco_initial_pheromone_value),
            problem)

        iterations = args.aco_iterations
    elif args.optimizer == 'ba':
        optimizer = jssp.ba.Optimizer(
            jssp.ba.Config(
                num_scouts       = args.ba_num_scouts,
                num_normal_sites = args.ba_num_normal_sites,
                num_elite_sites  = args.ba_num_elite_sites,
                num_normal_bees  = args.ba_num_normal_bees,
                num_elite_bees   = args.ba_num_elite_bees,
                taboo = jssp.utility.TabooConfig(
                    iteration_limit    = args.taboo_iteration_limit,
                    list_limit         = args.taboo_list_limit,
                    backtracking_limit = args.taboo_backtracking_limit,
                    max_cycle_duration = args.taboo_max_cycle_duration,
                    max_cycle_count    = args.taboo_max_cycle_count)),
            problem)

        iterations = args.ba_iterations
    elif args.optimizer == 'pso':
        optimizers = [jssp.pso.Optimizer(
            jssp.pso.Config(
                swarm_size = args.pso_swarm_size,
                c1         = args.pso_c1,
                c2         = args.pso_c2,
                w          = args.pso_w),
            problem)
            for _ in range(magic)]

        iterations = args.pso_iterations

    if args.iterations:
        iterations = args.iterations

    # solution = jssp.utility.generate_random_solution(problem)

    # while True:
    #     next_solution, _ = jssp.utility.apply_local_search(problem, solution.operations, steepest=True)

    #     print(next_solution.makespan)

    #     if solution == next_solution or next_solution.makespan >= solution.makespan:
    #         print('failure')
    #         break

    #     solution = next_solution

    pool = ThreadPool(12)

    res = [[pool.apply_async(optimizers[i].iterate) for i in range(12)] for _ in range(iterations)]



    for r in res:
        z = [x.get().makespan for x in r]
        print(z)

    # for _ in range(args.iterations):
    #     result = optimizer.iterate()

    #     if not args.script:
    #         print(result.makespan)

    if args.script:
        print(result.makespan)

    if args.render:
        allocations = jssp.utility.get_allocations(problem, result.operations)
        jssp.io.render_gantt_chart(args.output_filename, allocations)

    # best = optimizer.best()
    # schedule, allocations, makespan = develop_schedule(problem, best.schedule)
    # render_gantt_chart('solution.pdf', allocations)

    # reorderings = find_reorderings(problem, allocations)

    # for i, reordering in enumerate(reorderings):
    #     r_schedule, r_allocations, r_makespan = develop_schedule(problem, optimizer.gbest_schedule, reordering)
    #     print('{} {}'.format(i, str(reordering)))
    #     render_gantt_chart('{}.pdf'.format(i), r_allocations)

    # try:
    #     pool = ThreadPool()

    #     for _ in range(100):
    #         print(min(pool.map(lambda optimizer: optimizer.iterate(), optimizers)))

    #     pool.close()
    #     pool.join()

    # except KeyboardInterrupt:
    #     pass
    # finally:
    #     pass