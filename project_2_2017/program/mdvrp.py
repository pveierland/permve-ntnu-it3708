#!/usr/bin/python3

import argparse
import copy
import itertools
import math
import numpy as np
import operator
import os
import random
import sys

from collections import namedtuple, defaultdict

import vi.ea.adult_selection
import vi.ea.fixed_int_vector
import vi.ea.parent_selection
import vi.ea.reproduction
import vi.ea.system

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

Customer = namedtuple('Customer', ['number', 'x', 'y', 'duration', 'demand'])
Depot    = namedtuple('Depot', ['number', 'x', 'y', 'max_duration', 'max_load'])
Route    = namedtuple('Route', ['depot_number', 'vehicle_number', 'duration', 'load', 'sequence'])

class Creator(object):
    def __init__(self, problem):
        depot_customers_indexes = assign_customers_to_depots(problem)
        self.depot_sequences    = assign_depot_customers_to_sequences(problem, depot_customers_indexes)

    def __call__(self):
        return copy.deepcopy(self.depot_sequences)

class BestCostCustomerMutation(object):
    def __init__(self, problem, random_insertion_probability):
        self.problem                      = problem
        self.random_insertion_probability = random_insertion_probability

    def __call__(self, genotype):
        mutated = copy.deepcopy(genotype)

        random_depot_sequence = mutated[random.randrange(len(self.problem.depots))]
        if not random_depot_sequence:
            return genotype

        random_sequence = random.choice(random_depot_sequence)
        random_customer = random.choice(random_sequence)
        random_sequence.remove(random_customer)

        insertion_points = []

        for depot_index, depot_sequences in enumerate(mutated):
            depot = self.problem.depots[depot_index]

            for sequence_index, sequence in enumerate(depot_sequences):
                sequence_cost = calculate_duration_including_service_time(self.problem, depot, sequence)

                for insertion_position in range(len(sequence) + 1):
                    modified = sequence[:]
                    modified.insert(insertion_position, random_customer)

                    cost = calculate_duration_including_service_time(self.problem, depot, modified)
                    load = calculate_load(self.problem, modified)

                    if within_limits(depot, cost, load):
                        insertion_cost = cost - sequence_cost
                        insertion_points.append((insertion_cost, sequence, insertion_position))

        if not insertion_points:
            return genotype

        if random.random() < self.random_insertion_probability:
            insertion_point = random.choice(insertion_points)
        else:
            insertion_points.sort(key=lambda insertion_point: insertion_point[0])
            insertion_point = insertion_points[0]

        insertion_point[1].insert(insertion_point[2], random_customer)

        return mutated

class BestCostRouteCrossover(object):
    def __init__(self, problem, random_insertion_probability):
        self.problem                      = problem
        self.random_insertion_probability = random_insertion_probability

    def __call__(self, parent_1, parent_2):
        def insert_sequence_in_individual(individual, sequence):
            for c in sequence:
                insertion_points = []

                for depot_index, depot_sequences in enumerate(individual):
                    depot = self.problem.depots[depot_index]

                    for sequence_index, sequence in enumerate(depot_sequences):
                        sequence_cost = calculate_duration_including_service_time(self.problem, depot, sequence)
                        for insertion_position in range(len(sequence) + 1):
                            modified = sequence[:]
                            modified.insert(insertion_position, c)

                            cost = calculate_duration_including_service_time(self.problem, depot, modified)
                            load = calculate_load(self.problem, modified)

                            if within_limits(depot, cost, load):
                                insertion_cost = cost - sequence_cost
                                insertion_points.append((insertion_cost, sequence, insertion_position))

                if not insertion_points:
                    return False

                if random.random() < self.random_insertion_probability:
                    insertion_point = random.choice(insertion_points)
                else:
                    insertion_points.sort(key=lambda insertion_point: insertion_point[0])
                    insertion_point = insertion_points[0]

                insertion_point[1].insert(insertion_point[2], c)

            return True

        random_depot             = random.choice(self.problem.depots)
        random_depot_index       = random_depot.number - 1
        parent_1_depot_sequences = parent_1[random_depot_index]
        parent_2_depot_sequences = parent_2[random_depot_index]

        if parent_1_depot_sequences and parent_2_depot_sequences:
            # Randomly select a sequence from each parent
            sequence_1 = random.choice(parent_1_depot_sequences)
            sequence_2 = random.choice(parent_2_depot_sequences)

            child_1 = copy.deepcopy(parent_1)
            child_2 = copy.deepcopy(parent_2)

            # Remove all customers c belonging to sequence_2 from child_1
            child_1 = [list(filter(None, [[c for c in sequence if c not in sequence_2] for sequence in depot_sequences]))
                       for depot_sequences in child_1]
            
            # Remove all customers c belonging to sequence_1 from child_2
            child_2 = [list(filter(None, [[c for c in sequence if c not in sequence_1] for sequence in depot_sequences]))
                       for depot_sequences in child_2]

            if insert_sequence_in_individual(child_2, sequence_1) and insert_sequence_in_individual(child_1, sequence_2):
                return child_1, child_2

        return parent_1, parent_2

class FitnessFunction(object):
    def __init__(self, problem):
        self.problem = problem

    def __call__(self, solution):
        return 1.0 / sum(calculate_duration_excluding_service_time(self.problem, self.problem.depots[depot_index], sequence)
                         for depot_index, depot_sequences in enumerate(solution) for sequence in depot_sequences)

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
            elements       = line.split()
            depot_number   = int(elements[0])
            vehicle_number = int(elements[1])
            duration       = float(elements[2])
            load           = float(elements[3])
            sequence       = [int(element) for element in elements[4:]]
            return Route(depot_number, vehicle_number, duration, load, sequence)

        with open(filename) as file:
            cost   = float(file.readline().strip())
            routes = [parse_route(line) for line in file if line.strip()]
            return Solution(cost, routes)

    @staticmethod
    def from_genotype(problem, genotype):
        routes = [Route(depot_index + 1,
                        sequence_index + 1,
                        calculate_duration_including_service_time(problem, problem.depots[depot_index], sequence),
                        calculate_load(problem, sequence),
                        sequence)
                  for depot_index, depot_sequences in enumerate(genotype)
                  for sequence_index, sequence in enumerate(depot_sequences)]

        cost = sum(
            calculate_duration_excluding_service_time(problem, problem.depots[depot_index], sequence)
            for depot_index, depot_sequences in enumerate(genotype)
            for sequence_index, sequence in enumerate(depot_sequences))

        return Solution(cost, routes)

    def __init__(self, cost, routes):
        self.cost   = cost
        self.routes = routes

    def __str__(self):
        def property_width(property, formatting='{}'):
            return max(len(formatting.format(property(route))) for route in self.routes)

        depot_width    = property_width((lambda r: r.depot_number))
        vehicle_width  = property_width((lambda r: r.vehicle_number))
        duration_width = property_width((lambda r: r.duration), '{:.2f}')
        integer_loads  = all(route.load == round(route.load) for route in self.routes)
        load_width     = property_width((lambda r: r.load), '{:g}' if integer_loads else '{:.2f}')

        return ('{:.2f}\n'.format(self.cost) +
                '\n'.join(
                    ('{{:>{}d}} {{:>{}d}} {{:>{}.2f}} ' + ('{{:>{}g}}' if integer_loads else '{{:>{}.2f}}') + '   {{}}').format(
                        depot_width, vehicle_width + 2, duration_width + 2, load_width + 2).format(
                            route.depot_number,
                            route.vehicle_number,
                            route.duration,
                            route.load,
                            ' '.join(map(str, [0] + route.sequence + [0])))
                for route in sorted(self.routes, key=lambda route: (route.depot_number, route.vehicle_number))))

def assign_customers_to_depots(problem):
    depot_customer_indexes = [[] for _ in range(len(problem.depots))]

    for customer in problem.customers:
        depot_distances        = np.array([calculate_distance(customer, depot) for depot in problem.depots])
        random_min_depot_index = random.choice(np.argwhere(depot_distances == np.amin(depot_distances)).flatten())
        depot_customer_indexes[random_min_depot_index].append(customer.number - 1)

    return depot_customer_indexes

def assign_depot_customers_to_sequences(problem, depot_customer_indexes):
    depot_sequences      = [[] for _ in range(len(problem.depots))]
    sequence_assignments = [None for _ in range(len(problem.customers))]

    for depot_index, depot, customer_indexes in zip(range(len(problem.depots)), problem.depots, depot_customer_indexes):
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

                saving_entries.append((saving_value, customer_a_index, customer_b_index))

        saving_entries.sort(key=lambda saving_entry: saving_entry[0], reverse=True)

        for saving_entry in saving_entries:
            _, customer_a_index, customer_b_index = saving_entry

            customer_a_number = customer_a_index + 1
            customer_b_number = customer_b_index + 1

            customer_a_sequence = sequence_assignments[customer_a_index]
            customer_b_sequence = sequence_assignments[customer_b_index]

            customer_a_assigned = customer_a_sequence is not None
            customer_b_assigned = customer_b_sequence is not None

            is_customer_a_exterior = is_exterior(customer_a_sequence, customer_a_index)
            is_customer_b_exterior = is_exterior(customer_b_sequence, customer_b_index)

            if not customer_a_assigned and not customer_b_assigned:
                sequence = [customer_a_index + 1, customer_b_index + 1]
                cost     = calculate_duration_including_service_time(problem, depot, sequence)
                load     = calculate_load(problem, sequence)

                if within_limits(depot, cost, load):
                    sequence_assignments[customer_a_index] = sequence
                    sequence_assignments[customer_b_index] = sequence
                    depot_sequences[depot_index].append(sequence)

            elif (customer_a_assigned != customer_b_assigned) and (is_customer_a_exterior or is_customer_b_exterior):
                first_customer_index   = customer_a_index if is_customer_a_exterior else customer_b_index
                second_customer_index  = customer_a_index if is_customer_b_exterior else customer_b_index
                first_customer_number  = first_customer_index + 1
                second_customer_number = second_customer_index + 1

                sequence = sequence_assignments[first_customer_index]
                modified = sequence[:]

                if modified[0] == first_customer_number:
                    modified.insert(0, second_customer_number)
                else:
                    modified.append(second_customer_number)

                cost = calculate_duration_including_service_time(problem, depot, modified)
                load = calculate_load(problem, modified)

                if within_limits(depot, cost, load):
                    for customer_number in modified:
                        customer_index = customer_number - 1
                        sequence_assignments[customer_index] = modified

                    depot_sequences[depot_index].remove(sequence)
                    depot_sequences[depot_index].append(modified)

            elif (customer_a_assigned and customer_b_assigned and
                  (customer_a_sequence is not customer_b_sequence) and
                  is_customer_a_exterior and is_customer_b_exterior):

                modified = customer_a_sequence[:]

                if modified[0] == customer_a_number:
                    modified.reverse()

                modified.extend(customer_b_sequence if customer_b_sequence[0] == customer_b_number else reversed(customer_b_sequence))

                cost = calculate_duration_including_service_time(problem, depot, modified)
                load = calculate_load(problem, modified)

                if within_limits(depot, cost, load):
                    for customer_number in modified:
                        customer_index = customer_number - 1
                        sequence_assignments[customer_index] = modified

                    depot_sequences[depot_index].remove(customer_a_sequence)
                    depot_sequences[depot_index].remove(customer_b_sequence)
                    depot_sequences[depot_index].append(modified)

    for customer_index, sequence in enumerate(sequence_assignments):
        if not sequence:
            customer_number = customer_index + 1
            depot_sequences[depot_index].append([customer_number])

    return depot_sequences

def calculate_distance(from_location, to_location):
    return math.sqrt((to_location.x - from_location.x) ** 2 +
                     (to_location.y - from_location.y) ** 2)

def calculate_duration_excluding_service_time(problem, depot, sequence):
    if not sequence: return 0.0
    return (calculate_distance(depot, problem.customers[sequence[ 0] - 1]) +
            calculate_distance(depot, problem.customers[sequence[-1] - 1]) +
            sum(calculate_distance(problem.customers[a - 1], problem.customers[b - 1]) for a, b in zip(sequence, sequence[1:])))

def calculate_duration_including_service_time(problem, depot, sequence):
    if not sequence: return 0.0
    return (calculate_distance(depot, problem.customers[sequence[ 0] - 1]) +
            calculate_distance(depot, problem.customers[sequence[-1] - 1]) +
            sum(calculate_distance(problem.customers[a - 1], problem.customers[b - 1]) for a, b in zip(sequence, sequence[1:])) +
            sum(problem.customers[customer_number - 1].duration for customer_number in sequence))

def calculate_load(problem, sequence):
    return sum(problem.customers[customer_number - 1].demand for customer_number in sequence)
    
def is_exterior(sequence, customer_index):
    customer_number = customer_index + 1
    return sequence and (sequence[0] == customer_number or sequence[-1] == customer_number)

def within_limits(depot, duration, load):
    return ((depot.max_duration == 0 or duration <= depot.max_duration) and
            (depot.max_load == 0 or load <= depot.max_load))

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
        for depot_index, depot_customer_indexes in enumerate(grouping):
            color = route_colors[depot_index % len(route_colors)]

            for customer_index in depot_customer_indexes:
                painter.setPen(QPen(color, 0))
                painter.setBrush(QBrush(color))
                customer = problem.customers[customer_index]
                painter.drawEllipse(QPointF(customer.x, customer.y), 0.35, 0.35)

        for depot in problem.depots:
            color = route_colors[(depot.number - 1) % len(route_colors)]
            painter.setPen(QPen(color, 0))
            painter.setBrush(QBrush(color))
            painter.drawEllipse(QPointF(depot.x, depot.y), 0.8, 0.8)

    else:
        for route in routes:
            #painter.setPen(QPen(route_colors[route.depot_number - 1], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            painter.setPen(QPen(route_colors[(route.vehicle_number - 1) % len(route_colors)], pen_thickness, Qt.SolidLine, Qt.RoundCap))
            sequence = [0] + route.sequence + [0]
            for a_index, b_index in zip(sequence, sequence[1:]):
                a = problem.locations[a_index - 1] if a_index else problem.depots[route.depot_number - 1]
                b = problem.locations[b_index - 1] if b_index else problem.depots[route.depot_number - 1]
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
        depot_routes   = [route for route in solution.routes if route.depot_number == depot]
        depot_vehicles = list(set(route.vehicle_number for route in depot_routes))

        if len(depot_routes) > problem.max_vehicles:
            print('verify failed: using too many vehicles')
            sys.exit(1)

        if not (len(depot_vehicles) == len(depot_routes) and all(vehicle >= 1 and vehicle <= len(depot_routes) for vehicle in depot_vehicles)):
            print('verify failed: incorrect vehicle numbering')
            sys.exit(1)

    # Check that all customers are visited exactly once:
    unique_entries = list(set(customer for customer in itertools.chain.from_iterable(route.sequence[1:-1] for route in solution.routes) if customer))
    num_customers  = len(problem.customers)
    if not (len(unique_entries) == num_customers and all(entry >= 1 and entry <= num_customers for entry in unique_entries)):
        print('verify failed: every customer is not visited')
        sys.exit(1)

    # Calculate total range:
    calculated_cost = sum(
        calculate_duration_excluding_service_time(problem, problem.depots[route.depot_number - 1], route.sequence[1:-1])
        for route in solution.routes)

    for route in solution.routes:
        print(route)
        print(sum(problem.customers[customer_number - 1].duration for customer_number in route.sequence[1:-1]))
        print(calculate_duration_excluding_service_time(problem, problem.depots[route.depot_number - 1], route.sequence[1:-1]))
        print(route.duration)

    if abs(calculated_cost - solution.cost) > 0.1:
        print('verify failed: total cost does not match. actual={} expected={}'.format(calculated_cost, solution.cost))
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--crossover_randomness',  type=float, default=0.1)
    parser.add_argument('--crossover_rate',        type=float, default=0.9)
    parser.add_argument('--elitism_ratio',         type=float, default=0.01)
    parser.add_argument('--evolve',                type=int)
    parser.add_argument('--instance',              type=int)
    parser.add_argument('--mutation_randomness',   type=float, default=0.1)
    parser.add_argument('--mutation_rate',         type=float, default=0.25)
    parser.add_argument('--population_size',       type=int,   default=200)
    parser.add_argument('--problem')
    parser.add_argument('--render',                action='store_true')
    parser.add_argument('--render_filename',       type=str,   default='mdvrp.pdf')
    parser.add_argument('--render_grouping',       action='store_true')
    parser.add_argument('--render_routing',        action='store_true')
    parser.add_argument('--script',                action='store_true')
    parser.add_argument('--solution')
    parser.add_argument('--tournament_group_size', type=int,   default=5)
    parser.add_argument('--tournament_randomness', type=float, default=0.1)
    parser.add_argument('--verify',                action='store_true')
    args = parser.parse_args()

    if args.instance:
        program_path = os.path.dirname(os.path.realpath(__file__))
        problem = Problem.from_file(os.path.join(program_path,
            '../assignment/data/instances/p{:02d}'.format(args.instance)))
        solution = Solution.from_file(os.path.join(program_path,
            '../assignment/data/solutions/p{:02d}.res'.format(args.instance)))

        current_best_solution_path = os.path.join(program_path,
            '../data/top/p{:02d}.res'.format(args.instance))
        current_best_solution = (Solution.from_file(current_best_solution_path)
                                 if os.path.isfile(current_best_solution_path) else None)
    else:
        if args.problem:
            problem = Problem.from_file(args.problem)

        if args.solution:
            solution = Solution.from_file(args.solution)

    if args.render_grouping or args.render_routing:
        depot_customers_indexes = assign_customers_to_depots(problem)
        depot_sequences         = assign_depot_customers_to_sequences(problem, depot_customers_indexes)
        solution                = Solution.from_genotype(problem, depot_sequences)

        print(solution.cost)

        if args.render_grouping:
            render(args.render_filename, problem, None, depot_customers_indexes)
        elif args.render_routing:
            render(args.render_filename, problem, solution.routes, None)
    if args.evolve:
        system = vi.ea.system.System(
            Creator(problem),
            vi.ea.parent_selection.Tournament(
                group_size=args.tournament_group_size,
                random_selection_probability=args.tournament_randomness),
            vi.ea.adult_selection.GenerationalMixing(
                population_size=args.population_size,
                num_children=None,
                elitism_ratio=args.elitism_ratio),
            vi.ea.reproduction.Sexual(
                crossover_rate=args.crossover_rate,
                crossover_function=BestCostRouteCrossover(problem, args.crossover_randomness),
                mutation_rate=args.mutation_rate,
                mutation_function=BestCostCustomerMutation(problem, args.mutation_randomness)),
            FitnessFunction(problem),
            args.population_size)

        best_individual = None

        try:
            for generation in range(args.evolve + 1):
                best_individual = max(system.population, key=operator.attrgetter('fitness'))

                if not args.script:
                    if solution:
                        print('Generation {}: Best={:.2f} ({:.2f}%)'.format(
                            generation,
                            1.0 / best_individual.fitness,
                            100.0 * (1.0 / best_individual.fitness) / solution.cost))
                    else:
                        print('Generation {}: Best={:.2f}'.format(
                            generation,
                            (1.0 / best_individual.fitness)))

                system.evolve()
        except KeyboardInterrupt:
            pass
        finally:
            if best_individual:
                best_solution = Solution.from_genotype(problem, best_individual.genotype)

                if not args.script:
                    print()
                    print(best_solution)

                if args.instance and (not current_best_solution or best_solution.cost < current_best_solution.cost):
                    with open(current_best_solution_path, 'w') as current_best_solution_file:
                        print(best_solution, file=current_best_solution_file)

                if args.render:
                    render(args.render_filename, problem, best_solution.routes, None)

                if args.verify:
                    verify(problem, best_solution)

                print(best_solution.cost)
    else:
        if args.render:
            if problem and solution:
                render(args.render_filename, problem, solution.routes, None)
            else:
                print('problem and solution must be set for render')
                sys.exit(-1)

        if args.verify:
            if problem and solution:
                verify(problem, solution)
            else:
                print('problem and solution must be set for verification')
                sys.exit(-1)

if __name__ == '__main__':
    main()