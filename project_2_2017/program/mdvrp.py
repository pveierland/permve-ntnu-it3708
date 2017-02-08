#!/usr/bin/python3

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

import argparse
from collections import namedtuple, defaultdict
import math
import itertools
import numpy as np
import sys
import random

import vi.ea.adult_selection
import vi.ea.fixed_int_vector
import vi.ea.parent_selection
import vi.ea.reproduction
import vi.ea.system
import operator

Route    = namedtuple('Route', ['depot', 'vehicle', 'duration', 'load', 'sequence'])
Depot    = namedtuple('Depot', ['number', 'x', 'y', 'max_duration', 'max_load'])
Customer = namedtuple('Customer', ['number', 'x', 'y', 'duration', 'demand'])

def calculate_distance(from_location, to_location):
    return math.sqrt((to_location.x - from_location.x) ** 2 +
                     (to_location.y - from_location.y) ** 2)

# class Creator(object):
#     def __init__(self, problem):


class DevelopmentFunction(object):
    def __init__(self, problem):
        self.problem = problem

    def __call__(self, genotype):
        num_customers = len(self.problem.customers)
        num_depots    = len(self.problem.depots)

        routes      = []
        sequence    = [0]
        roundtrip   = 0
        depot_index = 0

        current_location = num_customers
        current_cost     = 0.0
        current_load     = 0.0
        total_cost       = 0.0

        index = 0
        while index < num_customers:
            customer_index = genotype[index]
            customer       = self.problem.customers[customer_index]
            depot          = self.problem.depots[depot_index]

            distance_to_customer = calculate_distance(self.problem.locations[current_location], customer)
            distance_to_depot    = calculate_distance(customer, depot)

            duration = distance_to_customer + distance_to_depot + customer.duration

            fit_in_route = ((depot.max_duration == 0 or current_cost + duration <= depot.max_duration) and
                            (current_load + customer.demand <= depot.max_load))

            if fit_in_route:
                sequence.append(customer_index + 1)
                current_location  = customer_index
                current_load     += customer.demand
                current_cost     += distance_to_customer + customer.duration
                index            += 1

            if not fit_in_route or index == num_customers:
                if len(sequence) == 1:
                    # Single customer exceeded maximum duration or load for depot.
                    print('often')
                    return None

                sequence.append(0)
                current_cost += calculate_distance(self.problem.locations[current_location], depot)
                total_cost   += current_cost
                routes.append(Route(depot_index + 1, roundtrip + 1, current_cost, current_load, sequence))
                sequence = [0]

                depot_index += 1
                if depot_index >= num_depots:
                    depot_index  = 0
                    roundtrip   += 1

                    if roundtrip >= self.problem.max_vehicles:
                        print("exceeded maximum number of vehicles")
                        return None

                current_location = num_customers + depot_index
                current_cost = 0.0
                current_load = 0.0

        return Solution(total_cost, routes)

class FitnessFunction(object):
    def __call__(self, solution):
        return 1.0 / solution.cost

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
        self.routes = sorted(routes, key=lambda r: (r.depot, r.vehicle))

    def __str__(self):
        def property_width(property, formatting='{}'):
            return max(len(formatting.format(property(route))) for route in self.routes)

        depot_width    = property_width((lambda r: r.depot))
        vehicle_width  = property_width((lambda r: r.vehicle))
        duration_width = property_width((lambda r: r.duration), '{:.2f}')
        integer_loads  = all(route.load == round(route.load) for route in self.routes)
        load_width     = property_width((lambda r: r.load), '{:g}' if integer_loads else '{:.2f}')

        return ('{:.2f}\n'.format(self.cost) +
                '\n'.join(
                    ('{{:>{}d}} {{:>{}d}} {{:>{}.2f}} ' + ('{{:>{}g}}' if integer_loads else '{{:>{}.2f}}') + '   {{}}').format(
                        depot_width, vehicle_width + 2, duration_width + 2, load_width + 2).format(
                            route.depot,
                            route.vehicle,
                            route.duration,
                            route.load,
                            ' '.join(map(str, route.sequence)))
                for route in sorted(self.routes, key=lambda route: (route.depot, route.vehicle))))

    def calculate_cost(self, problem):
        cost = 0.0

        for route in self.routes:
            for from_location_index, to_location_index in zip(route.sequence, route.sequence[1:]):
                from_location = problem.customers[from_location_index - 1] if from_location_index else problem.depots[route.depot - 1]
                to_location   = problem.customers[to_location_index   - 1] if to_location_index   else problem.depots[route.depot - 1]

                distance  = calculate_distance(from_location, to_location)
                cost     += distance + (to_location.duration if to_location_index else 0.0)

        return cost

def render(output_filename, problem, routes, grouping):
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
        QColor(31,120,180),
        QColor(227,26,28),
        QColor(106,61,154),
        QColor(51,160,44),
        QColor(177,89,40),
        QColor(255,127,0),
        QColor(251,154,153),
        QColor(166,206,227),
        QColor(202,178,214),
        QColor(178,223,138),
        QColor(253,191,111),
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

    if grouping:
        for depot_id, customer_ids in grouping.items():
            for customer_id in customer_ids:
                color = route_colors[depot_id]
                painter.setPen(QPen(color, 0))
                painter.setBrush(QBrush(color))
                customer = problem.customers[customer_id]
                painter.drawEllipse(QPointF(customer.x, customer.y), 0.35, 0.35)

    else:
        for route in routes:
            painter.setPen(QPen(route_colors[route.depot - 1], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            #painter.setPen(QPen(route_colors[route.vehicle - 1], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            print(route.sequence)
            for a_index, b_index in zip(route.sequence, route.sequence[1:]):
                a = problem.locations[a_index - 1] if a_index else problem.depots[route.depot - 1]
                b = problem.locations[b_index - 1] if b_index else problem.depots[route.depot - 1]
                painter.drawLine(QPointF(a.x, a.y), QPointF(b.x, b.y))

        painter.setPen(QPen(QColor(51, 51, 51), 0))
        painter.setBrush(QBrush(QColor(51, 51, 51)))

        for customer in problem.customers:
            painter.drawEllipse(QPointF(customer.x, customer.y), 0.35, 0.35)

        for depot in problem.depots:
            painter.drawEllipse(QPointF(depot.x, depot.y), 0.8, 0.8)

    painter.end()

def verify(problem, solution):
    # Check that no more vehicles are used than allowed:
    for depot in range(1, len(problem.depots) + 1):
        depot_routes   = [route for route in solution.routes if route.depot == depot]
        depot_vehicles = list(set(route.vehicle for route in depot_routes))

        if len(depot_routes) > problem.max_vehicles:
            print('using too many vehicles')
            sys.exit(1)

        if not (len(depot_vehicles) == len(depot_routes) and all(vehicle >= 1 and vehicle <= len(depot_routes) for vehicle in depot_vehicles)):
            print('incorrect vehicle numbering')
            sys.exit(1)

    # Check that all customers are visited exactly once:
    unique_entries = list(set(customer for customer in itertools.chain.from_iterable(route.sequence for route in solution.routes) if customer))
    num_customers  = len(problem.customers)
    if not (len(unique_entries) == num_customers and all(entry >= 1 and entry <= num_customers for entry in unique_entries)):
        print('every customer is not visited')
        sys.exit(1)

    # Calculate total range:
    calculated_cost = solution.calculate_cost(problem)
    if abs(calculated_cost - solution.cost) > 0.1:
        print('total cost does not match. actual={} expected={}'.format(calculated_cost, solution.cost))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--render',                       action='store_true')
    parser.add_argument('--render_grouping',                       action='store_true')
    parser.add_argument('--verify',                      action='store_true')
    parser.add_argument('--render_filename',              type=str,   default='mdvrp.pdf')

    parser.add_argument('--problem')
    parser.add_argument('--solution')
    parser.add_argument('--population_size', type=int, default=500)
    parser.add_argument('--evolve', type=int)
    args = parser.parse_args()

    if args.problem:
        problem = Problem.from_file(args.problem)

    if args.solution:
        solution = Solution.from_file(args.solution)

        if args.verify:
            verify(problem, solution)

    if args.render_grouping:
        # Grouping: Assign customers to depots
        depot_customers = defaultdict(list)
        for customer in problem.customers:
            depot_distances  = np.array([calculate_distance(customer, depot) for depot in problem.depots])
            random_min_depot = random.choice(np.argwhere(depot_distances == np.amin(depot_distances)).flatten())
            depot_customers[random_min_depot].append(customer.number - 1)

        # Routing: Assign customers within depots to routes

        real_routes = []

        for depot_id, customer_ids in depot_customers.items():
            depot = problem.depots[depot_id]

            savings = []

            for i in range(len(customer_ids)):
                for j in range(i + 1, len(customer_ids)):
                    ci = customer_ids[i]
                    cj = customer_ids[j]
                    
                    saving = (calculate_distance(depot, problem.customers[ci]) +
                              calculate_distance(depot, problem.customers[cj]) -
                              calculate_distance(problem.customers[ci], problem.customers[cj]))

                    savings.append((ci, cj, saving))

            savings.sort(key=lambda s: s[2], reverse=True)

            depot_routes      = []
            route_assignments = {customer_id: None for customer_id in customer_ids}

            def is_exterior(route, customer_id):
                return route and (route.sequence[0] == customer_id or route.sequence[-1] == customer_id)

            def calculate_duration(sequence):
                return (calculate_distance(depot, problem.customers[sequence[0]]) +
                        calculate_distance(depot, problem.customers[sequence[-1]]) +
                        sum(calculate_distance(problem.customers[a], problem.customers[b]) for a, b in zip(sequence, sequence[1:])) +
                        sum(problem.customers[s].duration for s in sequence))

            def calculate_load(sequence):
                return sum(problem.customers[s].demand for s in sequence)

            def within_limits(depot, duration, load):
                return ((depot.max_duration == 0 or duration <= depot.max_duration) and
                        (depot.max_load == 0 or load <= depot.max_load))

            for saving in savings:
                ci, cj, value = saving

                if not route_assignments[ci] and not route_assignments[cj]:
                    sequence = [ci, cj]
                    duration = calculate_duration(sequence)
                    load     = calculate_load(sequence)

                    if within_limits(depot, duration, load):
                        route = Route(depot_id + 1, 0, duration, load, sequence)
                        route_assignments[ci] = route
                        route_assignments[cj] = route
                        depot_routes.append(route)
                elif bool(route_assignments[ci]) != bool(route_assignments[cj]) and is_exterior(route_assignments[ci], ci):
                    route = route_assignments[ci]

                    sequence = route.sequence[:]
                    if sequence[0] == ci:
                        sequence.insert(0, cj)
                    else:
                        sequence.append(cj)

                    duration = calculate_duration(sequence)
                    load     = calculate_load(sequence)

                    if within_limits(depot, duration, load):
                        new_route = Route(depot_id + 1, 0, duration, load, sequence)

                        for customer_id in sequence:
                            route_assignments[customer_id] = new_route

                        depot_routes.append(new_route)
                        depot_routes.remove(route)
                elif bool(route_assignments[ci]) != bool(route_assignments[cj]) and is_exterior(route_assignments[cj], cj):
                    route = route_assignments[cj]

                    sequence = route.sequence[:]
                    if sequence[0] == cj:
                        sequence.insert(0, ci)
                    else:
                        sequence.append(ci)

                    duration = calculate_duration(sequence)
                    load     = calculate_load(sequence)

                    if within_limits(depot, duration, load):
                        new_route = Route(depot_id + 1, 0, duration, load, sequence)

                        for customer_id in sequence:
                            route_assignments[customer_id] = new_route

                        depot_routes.append(new_route)
                        depot_routes.remove(route)
                elif (route_assignments[ci] and route_assignments[cj] and route_assignments[ci] != route_assignments[cj] and
                      is_exterior(route_assignments[ci], ci) and is_exterior(route_assignments[cj], cj)):
                    route_a = route_assignments[ci]
                    route_b = route_assignments[cj]

                    sequence_a = route_a.sequence[:]
                    sequence_b = route_b.sequence[:]

                    if sequence_a[0] == ci:
                        sequence_a.reverse()

                    if sequence_b[-1] == cj:
                        sequence_b.reverse()

                    sequence_a.extend(sequence_b)

                    duration = calculate_duration(sequence_a)
                    load     = calculate_load(sequence_a)

                    if within_limits(depot, duration, load):
                        new_route = Route(depot_id + 1, 0, duration, load, sequence_a)

                        for customer_id in sequence_a + sequence_b:
                            route_assignments[customer_id] = new_route

                        depot_routes.append(new_route)
                        depot_routes.remove(route_a)
                        depot_routes.remove(route_b)

            real_routes.extend([Route(route.depot, i + 1, route.duration, route.load, [0] + list(map((lambda x: x + 1), route.sequence)) + [0]) for i, route in enumerate(depot_routes)])

        render(args.render_filename, problem, real_routes, None)
    elif args.render:
        render(args.render_filename, problem, solution.routes, None)

    

    # if args.evolve:
    #     system = vi.ea.system.System(
    #         vi.ea.fixed_int_vector.SequenceCreator(length=len(problem.customers)),
    #         #vi.ea.parent_selection.Rank(),
    #         vi.ea.parent_selection.Tournament(group_size=5, random_selection_probability=0.1),
    #         vi.ea.adult_selection.GenerationalMixing(args.population_size, None, 0.01),
    #         vi.ea.reproduction.Sexual(
    #             vi.ea.fixed_int_vector.OrderedCrossover(),
    #             vi.ea.fixed_int_vector.ExchangeMutation(0.25)),
    #         FitnessFunction(),
    #         args.population_size,
    #         DevelopmentFunction(problem))

    #     best_individual = None

    #     try:
    #         for generation in range(args.evolve):
    #             best_individual = max(system.population, key=operator.attrgetter('fitness'))
    #             diversity       = vi.ea.fixed_int_vector.diversity(system.population)

    #             if solution:
    #                 print('Generation {}: Diversity={:.6f} Best={:.2f} ({:.2f}%)'.format(
    #                     generation + 1,
    #                     diversity,
    #                     best_individual.phenotype.cost,
    #                     100.0 * best_individual.phenotype.cost / solution.cost))
    #             else:
    #                 print('Generation {}: Diversity={:.6f} Best={:.2f}'.format(
    #                     generation + 1,
    #                     diversity,
    #                     best_individual.phenotype.cost))

    #             system.evolve()
    #     except KeyboardInterrupt:
    #         pass
    #     finally:
    #         if best_individual:
    #             print()
    #             print(best_individual.phenotype)

if __name__ == '__main__':
    main()