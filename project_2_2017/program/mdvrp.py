#!/usr/bin/python3

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

import copy
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

Depot    = namedtuple('Depot', ['number', 'x', 'y', 'max_duration', 'max_load'])
Customer = namedtuple('Customer', ['number', 'x', 'y', 'duration', 'demand'])

class Creator(object):
    def __init__(self, problem):
        depot_customers_indexes = assign_customers_to_depots(problem)
        self.routes             = assign_depot_customers_to_routes(problem, depot_customers_indexes)

    def __call__(self):
        return copy.deepcopy(self.routes)

class BestCostRouteCrossover(object):
    def __init__(self, problem):
        self.problem = problem

    def __call__(self, parent_1, parent_2):
        random_depot = random.choice(self.problem.depots)

        parent_1_depot_routes = [route for route in parent_1 if route.depot_number() == random_depot.number]
        parent_2_depot_routes = [route for route in parent_2 if route.depot_number() == random_depot.number]

        if parent_1_depot_routes and parent_2_depot_routes:
            # Randomly select a route from each parent
            route_1 = random.choice(parent_1_depot_routes)
            route_2 = random.choice(parent_2_depot_routes)

            child_1 = copy.deepcopy(parent_1)
            child_2 = copy.deepcopy(parent_2)

            # Remove all customers c belonging to route_1 from child_2
            for route in child_2:
                route.update_sequence(self.problem, [c for c in route.sequence if c not in route_1.sequence])

            # Remove all customers c belonging to route_2 from child_1
            for route in child_1:
                route.update_sequence(self.problem, [c for c in route.sequence if c not in route_2.sequence])

            for c in route_1.sequence:
                insertion_points = []

                for route_index, route in enumerate(child_2):
                    depot = self.problem.depots[route.depot_index]

                    for insertion_position in range(len(route.sequence) + 1):
                        sequence = route.sequence[:]
                        sequence.insert(insertion_position, c)

                        duration = calculate_duration(self.problem, depot, sequence)
                        load     = calculate_load(self.problem, sequence)

                        if within_limits(depot, duration, load):
                            insertion_cost = duration - route.duration
                            insertion_points.append((route_index, insertion_position, insertion_cost))

                if not insertion_points:
                    # Fail crossover
                    return copy.deepcopy(parent_1), copy.deepcopy(parent_2)

                if random.random() < 0.1:
                    insertion_point = random.choice(insertion_points)
                else:
                    insertion_points.sort(key=lambda insertion_point: insertion_point[2])
                    insertion_point = insertion_points[0]

                insertion_route = child_2[insertion_point[0]]
                insertion_sequence = insertion_route.sequence[:]
                insertion_sequence.insert(insertion_point[1], c)
                insertion_route.update_sequence(self.problem, insertion_sequence)

            # Filter empty sequences
            child_2 = [route for route in child_2 if route.sequence]

            depot_index   = -1
            vehicle_index = 0
            
            for route in sorted(child_2, key=lambda route: route.depot_index):
                if route.depot_index != depot_index:
                    vehicle_index = 0
                    depot_index   = route.depot_index
                route.vehicle_index = vehicle_index
                vehicle_index += 1

            for c in route_2.sequence:
                insertion_points = []

                for route_index, route in enumerate(child_1):
                    depot = self.problem.depots[route.depot_index]

                    for insertion_position in range(len(route.sequence) + 1):
                        sequence = route.sequence[:]
                        sequence.insert(insertion_position, c)

                        duration = calculate_duration(self.problem, depot, sequence)
                        load     = calculate_load(self.problem, sequence)

                        if within_limits(depot, duration, load):
                            insertion_cost = duration - route.duration
                            insertion_points.append((route_index, insertion_position, insertion_cost))

                if not insertion_points:
                    # Fail crossover
                    return copy.deepcopy(parent_1), copy.deepcopy(parent_2)

                if random.random() < 0.1:
                    insertion_point = random.choice(insertion_points)
                else:
                    insertion_points.sort(key=lambda insertion_point: insertion_point[2])
                    insertion_point = insertion_points[0]

                insertion_route = child_1[insertion_point[0]]
                insertion_sequence = insertion_route.sequence[:]
                insertion_sequence.insert(insertion_point[1], c)
                insertion_route.update_sequence(self.problem, insertion_sequence)

            child_1 = [route for route in child_1 if route.sequence]

            depot_index   = -1
            vehicle_index = 0
            
            for route in sorted(child_1, key=lambda route: route.depot_index):
                if route.depot_index != depot_index:
                    vehicle_index = 0
                    depot_index   = route.depot_index
                route.vehicle_index = vehicle_index
                vehicle_index += 1

            return child_1, child_2
        else:
            return copy.deepcopy(parent_1), copy.deepcopy(parent_2)

class FitnessFunction(object):
    def __call__(self, solution):
        return 1.0 / sum(route.duration for route in solution)

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

class Route(object):
    def __init__(self, depot_index, vehicle_index, duration, load, sequence):
        self.depot_index   = depot_index
        self.vehicle_index = vehicle_index
        self.duration      = duration
        self.load          = load
        self.sequence      = sequence

    def depot_number(self):
        return self.depot_index + 1

    def update(self, duration, load, sequence):
        self.duration = duration
        self.load     = load
        self.sequence = sequence

    def update_sequence(self, problem, sequence):
        depot = problem.depots[self.depot_index]
        self.duration = calculate_duration(problem, depot, sequence)
        self.load     = calculate_load(problem, sequence)
        self.sequence = sequence

    def vehicle_number(self):
        return self.vehicle_index + 1

class Solution(object):
    @staticmethod
    def from_file(filename):
        def parse_route(line):
            elements       = line.split()
            depot_number   = int(elements[0])
            vehicle_number = int(elements[1])
            duration       = float(elements[2])
            load           = float(elements[3])
            sequence       = [int(element) for element in elements[4:]][1:-1] # Chop of start and ending 0 markers
            return Route(depot_number - 1, vehicle_number - 1, duration, load, sequence)

        with open(filename) as file:
            cost   = float(file.readline().strip())
            routes = [parse_route(line) for line in file if line.strip()]
            return Solution(None, routes, cost)

    def __init__(self, problem, routes, cost=None):
        self.routes = sorted(routes, key=lambda r: (r.depot_number(), r.vehicle_number()))
        self.cost   = cost or calculate_cost(problem, routes)

    def __str__(self):
        def property_width(property, formatting='{}'):
            return max(len(formatting.format(property(route))) for route in self.routes)

        depot_width    = property_width((lambda r: r.depot_number()))
        vehicle_width  = property_width((lambda r: r.vehicle_number()))
        duration_width = property_width((lambda r: r.duration), '{:.2f}')
        integer_loads  = all(route.load == round(route.load) for route in self.routes)
        load_width     = property_width((lambda r: r.load), '{:g}' if integer_loads else '{:.2f}')

        return ('{:.2f}\n'.format(self.cost) +
                '\n'.join(
                    ('{{:>{}d}} {{:>{}d}} {{:>{}.2f}} ' + ('{{:>{}g}}' if integer_loads else '{{:>{}.2f}}') + '   {{}}').format(
                        depot_width, vehicle_width + 2, duration_width + 2, load_width + 2).format(
                            route.depot_number(),
                            route.vehicle_number(),
                            route.duration,
                            route.load,
                            ' '.join(map(str, [0] + route.sequence + [0])))
                for route in sorted(self.routes, key=lambda route: (route.depot_number(), route.vehicle_number()))))

def assign_customers_to_depots(problem):
    depot_customers_indexes = defaultdict(list)
    for customer in problem.customers:
        depot_distances  = np.array([calculate_distance(customer, depot) for depot in problem.depots])
        random_min_depot = random.choice(np.argwhere(depot_distances == np.amin(depot_distances)).flatten())
        depot_customers_indexes[random_min_depot].append(customer.number - 1)
    return depot_customers_indexes

def assign_depot_customers_to_routes(problem, depot_customers_indexes):
    routes = []

    for depot_index, customer_indexes in depot_customers_indexes.items():
        depot          = problem.depots[depot_index]
        saving_entries = []

        for i in range(len(customer_indexes)):
            for j in range(i + 1, len(customer_indexes)):
                customer_a_index = customer_indexes[i]
                customer_b_index = customer_indexes[j]

                customer_a = problem.customers[customer_a_index]
                customer_b = problem.customers[customer_b_index]
                
                saving_value = (calculate_distance(depot, customer_a) +
                                calculate_distance(depot, customer_b) -
                                calculate_distance(customer_a, customer_b))

                saving_entries.append((customer_a_index, customer_b_index, saving_value))

        saving_entries.sort(key=lambda saving_entry: saving_entry[2], reverse=True)

        depot_routes      = []
        route_assignments = {customer_index: None for customer_index in customer_indexes}

        for saving_entry in saving_entries:
            customer_a_index, customer_b_index, _ = saving_entry

            customer_a_route = route_assignments[customer_a_index]
            customer_b_route = route_assignments[customer_b_index]

            customer_a_assigned = customer_a_route is not None
            customer_b_assigned = customer_b_route is not None

            is_customer_a_exterior = is_exterior(customer_a_route, customer_a_index)
            is_customer_b_exterior = is_exterior(customer_b_route, customer_b_index)

            if not customer_a_assigned and not customer_b_assigned:
                sequence = [customer_a_index + 1, customer_b_index + 1]
                duration = calculate_duration(problem, depot, sequence)
                load     = calculate_load(problem, sequence)

                if within_limits(depot, duration, load):
                    route = Route(depot_index, 0, duration, load, sequence)
                    route_assignments[customer_a_index] = route
                    route_assignments[customer_b_index] = route
                    depot_routes.append(route)
            elif (customer_a_assigned != customer_b_assigned) and (is_customer_a_exterior or is_customer_b_exterior):
                first_customer_index   = customer_a_index if is_customer_a_exterior else customer_b_index
                second_customer_index  = customer_a_index if is_customer_b_exterior else customer_b_index
                first_customer_number  = first_customer_index + 1
                second_customer_number = second_customer_index + 1

                route    = route_assignments[first_customer_index]
                sequence = route.sequence[:]

                if sequence[0] == first_customer_number:
                    sequence.insert(0, second_customer_number)
                else:
                    sequence.append(second_customer_number)

                duration = calculate_duration(problem, depot, sequence)
                load     = calculate_load(problem, sequence)

                if within_limits(depot, duration, load):
                    route.update(duration, load, sequence)
                    route_assignments[second_customer_index] = route

            elif (customer_a_assigned and customer_b_assigned and
                  customer_a_route is not customer_b_route and
                  is_customer_a_exterior and is_customer_b_exterior):

                customer_a_number = customer_a_index + 1
                customer_b_number = customer_b_index + 1

                route_a = route_assignments[customer_a_index]
                route_b = route_assignments[customer_b_index]

                sequence_a = route_a.sequence[:]
                sequence_b = route_b.sequence[:]

                if sequence_a[0] == customer_a_number:
                    sequence_a.reverse()

                if sequence_b[-1] == customer_b_number:
                    sequence_b.reverse()

                sequence_a.extend(sequence_b)

                duration = calculate_duration(problem, depot, sequence_a)
                load     = calculate_load(problem, sequence_a)

                if within_limits(depot, duration, load):
                    route_a.update(duration, load, sequence_a)

                    for customer_number in sequence_b:
                        customer_index = customer_number - 1
                        route_assignments[customer_index] = route_a

                    depot_routes.remove(route_b)

        for customer_index, route in route_assignments.items():
            if not route:
                customer_number = customer_index + 1
                sequence = [customer_number]
                duration = calculate_duration(problem, depot, sequence)
                load     = calculate_load(problem, sequence)
                route    = Route(depot_index, 0, duration, load, sequence)
                route_assignments[customer_index] = route
                depot_routes.append(route)

        for i, depot_route in enumerate(depot_routes):
            depot_route.vehicle_index = i

        routes.extend(depot_routes)

    return routes

def calculate_cost(problem, routes):
    return sum(calculate_duration(problem, problem.depots[route.depot_index], route.sequence)
               for route in routes)

def calculate_distance(from_location, to_location):
    return math.sqrt((to_location.x - from_location.x) ** 2 +
                     (to_location.y - from_location.y) ** 2)

def calculate_duration(problem, depot, sequence):
    if not sequence: return 0.0
    return (calculate_distance(depot, problem.customers[sequence[ 0] - 1]) +
            calculate_distance(depot, problem.customers[sequence[-1] - 1]) +
            sum(calculate_distance(problem.customers[a - 1], problem.customers[b - 1]) for a, b in zip(sequence, sequence[1:])) +
            sum(problem.customers[customer_number - 1].duration for customer_number in sequence))

def calculate_load(problem, sequence):
    return sum(problem.customers[customer_number - 1].demand for customer_number in sequence)
    
def is_exterior(route, customer_index):
    customer_number = customer_index + 1
    return route and (route.sequence[0] == customer_number or route.sequence[-1] == customer_number)

def within_limits(depot, duration, load):
    return ((depot.max_duration == 0 or duration <= depot.max_duration) and
            (depot.max_load == 0 or load <= depot.max_load))

# class DevelopmentFunction(object):
#     def __init__(self, problem):
#         self.problem = problem

#     def __call__(self, genotype):
#         num_customers = len(self.problem.customers)
#         num_depots    = len(self.problem.depots)

#         routes      = []
#         sequence    = [0]
#         roundtrip   = 0
#         depot_index = 0

#         current_location = num_customers
#         current_cost     = 0.0
#         current_load     = 0.0
#         total_cost       = 0.0

#         index = 0
#         while index < num_customers:
#             customer_index = genotype[index]
#             customer       = self.problem.customers[customer_index]
#             depot          = self.problem.depots[depot_index]

#             distance_to_customer = calculate_distance(self.problem.locations[current_location], customer)
#             distance_to_depot    = calculate_distance(customer, depot)

#             duration = distance_to_customer + distance_to_depot + customer.duration

#             fit_in_route = ((depot.max_duration == 0 or current_cost + duration <= depot.max_duration) and
#                             (current_load + customer.demand <= depot.max_load))

#             if fit_in_route:
#                 sequence.append(customer_index + 1)
#                 current_location  = customer_index
#                 current_load     += customer.demand
#                 current_cost     += distance_to_customer + customer.duration
#                 index            += 1

#             if not fit_in_route or index == num_customers:
#                 if len(sequence) == 1:
#                     # Single customer exceeded maximum duration or load for depot.
#                     print('often')
#                     return None

#                 sequence.append(0)
#                 current_cost += calculate_distance(self.problem.locations[current_location], depot)
#                 total_cost   += current_cost
#                 routes.append(Route(depot_index, roundtrip, current_cost, current_load, sequence))
#                 sequence = [0]

#                 depot_index += 1
#                 if depot_index >= num_depots:
#                     depot_index  = 0
#                     roundtrip   += 1

#                     if roundtrip >= self.problem.max_vehicles:
#                         print("exceeded maximum number of vehicles")
#                         return None

#                 current_location = num_customers + depot_index
#                 current_cost = 0.0
#                 current_load = 0.0

#         return Solution(total_cost, routes)

# class FitnessFunction(object):
#     def __call__(self, solution):
#         return 1.0 / solution.cost

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

        for depot in problem.depots:
            color = route_colors[depot.number - 1]
            painter.setPen(QPen(color, 0))
            painter.setBrush(QBrush(color))
            painter.drawEllipse(QPointF(depot.x, depot.y), 0.8, 0.8)

    else:
        for route in routes:
            painter.setPen(QPen(route_colors[route.depot_index], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            #painter.setPen(QPen(route_colors[route.vehicle_index], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            sequence = [0] + route.sequence + [0]
            for a_index, b_index in zip(sequence, sequence[1:]):
                a = problem.locations[a_index - 1] if a_index else problem.depots[route.depot_index]
                b = problem.locations[b_index - 1] if b_index else problem.depots[route.depot_index]
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
        depot_routes   = [route for route in solution.routes if route.depot_number() == depot]
        depot_vehicles = list(set(route.vehicle_number() for route in depot_routes))

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
    calculated_cost = calculate_cost(problem, solution.routes)
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
        depot_customers_indexes = assign_customers_to_depots(problem)
        routes = assign_depot_customers_to_routes(problem, depot_customers_indexes)
        
        solution = Solution(problem, routes)

        print(solution)

        verify(problem, solution)

        #render(args.render_filename, problem, routes, None)
        render(args.render_filename, problem, None, depot_customers_indexes)

    elif args.render:
        render(args.render_filename, problem, solution.routes, None)

    if args.evolve:
        system = vi.ea.system.System(
            Creator(problem),
            #vi.ea.parent_selection.Rank(),
            vi.ea.parent_selection.Tournament(group_size=5, random_selection_probability=0.1),
            vi.ea.adult_selection.GenerationalMixing(args.population_size, None, 0.01),
            vi.ea.reproduction.Sexual(
                BestCostRouteCrossover(problem),
                None),
            FitnessFunction(),
            args.population_size)

        best_individual = None

        try:
            for generation in range(args.evolve):
                best_individual = max(system.population, key=operator.attrgetter('fitness'))

                if solution:
                    print('Generation {}: Best={:.2f} ({:.2f}%)'.format(
                        generation + 1,
                        1.0 / best_individual.fitness,
                        100.0 * (1.0 / best_individual.fitness) / solution.cost))
                else:
                    print('Generation {}: Best={:.2f}'.format(
                        generation + 1,
                        (1.0 / best_individual.fitness)))

                system.evolve()
        except KeyboardInterrupt:
            pass
        finally:
            if best_individual:
                best_solution = Solution(problem, best_individual.genotype)
                print()
                print(best_solution)

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