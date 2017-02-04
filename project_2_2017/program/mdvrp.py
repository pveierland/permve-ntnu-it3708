#!/usr/bin/python3

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

import argparse
from collections import namedtuple
import math
import numpy as np
import sys

Route    = namedtuple('Route', ['depot', 'vehicle', 'duration', 'load', 'sequence'])
Depot    = namedtuple('Depot', ['number', 'x', 'y', 'max_duration', 'max_load'])
Customer = namedtuple('Customer', ['number', 'x', 'y', 'duration', 'demand'])

class Problem(object):
    @staticmethod
    def from_file(filename):
        def parse_customer(line):
            elements = line.split()
            number   = int(elements[0])
            x        = float(elements[1])
            y        = float(elements[2])
            duration = float(elements[3])
            demand   = float(elements[4])
            return Customer(number, x, y, duration, demand)

        def parse_depot(number, spec, line):
            elements = line.split()
            x        = float(elements[1])
            y        = float(elements[2])
            return Depot(number, x, y, spec[0], spec[1])

        with open(filename) as file:
            max_vehicles, customer_count, depot_count = list(map(int, file.readline().split()))[-3:]
            depots_specs = [tuple(map(float, file.readline().split())) for _ in range(depot_count)]
            customers    = [parse_customer(file.readline()) for _ in range(customer_count)]
            depots       = [parse_depot(i + 1, depots_specs[i], file.readline()) for i in range(depot_count)]
            return Problem(max_vehicles, customers, depots)

    def __init__(self, max_vehicles, customers, depots):
        self.max_vehicles = max_vehicles
        self.customers    = customers
        self.depots       = depots
        self.locations    = customers + depots

    def is_depot(self, index):
        return index == 0 or index > len(self.customers)

class Solution(object):
    @staticmethod
    def from_file(filename):
        def parse_route(line):
            elements = line.split()
            depot    = int(elements[0])
            vehicle  = int(elements[1])
            duration = float(elements[2])
            load     = float(elements[3])
            sequence = [int(element) for element in elements[4:]]
            return Route(depot, vehicle, duration, load, sequence)

        with open(filename) as file:
            cost   = float(file.readline().strip())
            routes = [parse_route(line) for line in file if line.strip()]
            return Solution(cost, routes)

    def __init__(self, cost, routes):
        self.cost   = cost
        self.routes = routes

def render(output_filename, problem, solution):
    app = QApplication([ '-platform', 'offscreen'])

    cell_size   = 50
    margin_ratio = 0.05
    pen_thickness = 0.25

    colors = {
        'line': QColor( 51,  51,  51),
        'path': QColor( 51,  51,  51)
    }

    route_colors = [
        # http://colorbrewer2.org/#type=qualitative&scheme=Paired&n=12
        QColor(51,160,44),
        QColor(255,127,0),
        QColor(166,206,227),
        QColor(202,178,214),
        QColor(31,120,180),
        QColor(178,223,138),
        QColor(251,154,153),
        QColor(227,26,28),
        QColor(253,191,111),
        QColor(106,61,154),
        QColor(177,89,40),
        QColor(255,255,153),
        QColor(0, 0, 0)
    ]

    x_min = min(location.x for location in problem.locations)
    x_max = max(location.x for location in problem.locations)
    y_min = min(location.y for location in problem.locations)
    y_max = max(location.y for location in problem.locations)

    width    = x_max - x_min
    height   = y_max - y_min

    printer = QPrinter()
    printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(output_filename)
    printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)

    printer.setPageSize(QPageSize(
        QSizeF((1 + 2 * margin_ratio) * cell_size * width / printer.resolution(),
               (1 + 2 * margin_ratio) * cell_size * height / printer.resolution()),
        QPageSize.Inch))

    painter = QPainter(printer)
    painter.scale(cell_size, -cell_size)
    painter.translate(-x_min + margin_ratio * width, -(height + y_min + margin_ratio * height))

    for route in solution.routes:
        painter.setPen(QPen(route_colors[route.vehicle - 1], pen_thickness, Qt.SolidLine, Qt.RoundCap))

        for a_index, b_index in zip(route.sequence, route.sequence[1:]):
            a = problem.locations[a_index - 1] if a_index else problem.depots[route.depot - 1]
            b = problem.locations[b_index - 1] if b_index else problem.depots[route.depot - 1]
            painter.drawLine(QPointF(a.x, a.y), QPointF(b.x, b.y))

    painter.setPen(QPen(QColor(51, 51, 51), 0))
    painter.setBrush(QBrush(QColor(51, 51, 51)))

    for location in problem.locations:
        painter.drawEllipse(QPointF(location.x, location.y), 0.35, 0.35)

    painter.end()

#print('{} {}'.format(sys.argv[1], max(route.vehicle for route in solution.routes)))


# for route in solution.routes:
#     current_location = route.sequence[0]
#     distance = 0

#     for next_location in route.sequence[1:]:
#         current_x, current_y = (
#             (problem.locations[current_location - 1].x, problem.locations[current_location - 1].y)
#             if current_location else (problem.depots[route.depot - 1].x, problem.depots[route.depot - 1].y))

#         next_x, next_y = (
#             (problem.locations[next_location - 1].x, problem.locations[next_location - 1].y)
#             if next_location else (problem.depots[route.depot - 1].x, problem.depots[route.depot - 1].y))

#         distance += math.sqrt((next_x - current_x) ** 2 + (next_y - current_y) ** 2)
#         current_location = next_location

#     for location in route.sequence:
#         if not problem.is_depot(location):
#             distance += problem.locations[location - 1].duration

#     print('distance = {}'.format(distance))
#     print('demand = {}'.format(sum(problem.customers[customer_number - 1].demand for customer_number in route.sequence[1:-1])))



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--render',                       action='store_true')
    parser.add_argument('--render_filename',              type=str,   default='mdvrp.pdf')
    parser.add_argument('--problem')
    parser.add_argument('--solution')
    args = parser.parse_args()

    if args.problem:
        problem = Problem.from_file(args.problem)

    if args.solution:
        solution = Solution.from_file(args.solution)

    if args.render:
        render(args.render_filename, problem, solution)

if __name__ == '__main__':
    main()