#!/usr/bin/python3

import colour
import numpy

import collections
import functools
import math
import operator
import random
import sys
import threading
import time

from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
from matplotlib import cm

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *

def pairwise(iterable):
    "s -> (s0,s1), (s1,s2), (s2, s3), ..."
    a, b = tee(iterable)
    next(b, None)
    return zip(a, b)

class Individual(object):
    def __init__(self, sequence, cost, distance):
        self.sequence          = sequence
        self.cost              = cost
        self.distance          = distance
        self.S                 = []
        self.n                 = 0
        self.crowding_distance = 0
        self.score             = 0

def crowding_distance_operator(a, b):
    if a.rank < b.rank or (a.rank == b.rank and a.crowding_distance > b.crowding_distance):
        return -1
    elif b.rank < a.rank or (b.rank == a.rank and b.crowding_distance > a.crowding_distance):
        return 1
    else:
        return 0

def rank_operator(a, b):
    if a.rank < b.rank:
        return -1
    elif b.rank < a.rank:
        return 1
    else:
        return 0

class Mtsp(object):
    @staticmethod
    def __read_matrix_file(filename):
        with open(filename) as matrix_file:
            num_cities = len(matrix_file.readline().split(',')) - 1
            values = numpy.zeros((num_cities, num_cities))

            for i in range(num_cities):
                row = list(float(value) for value in matrix_file.readline().split(',')[1:] if value.strip())
                values[i,:len(row)] = row
                values[:len(row),i] = row

            return values

    def __init__(self, distance_filename, cost_filename):
        self.distances  = Mtsp.__read_matrix_file(distance_filename)
        self.costs      = Mtsp.__read_matrix_file(cost_filename)
        self.num_cities = self.distances.shape[0]
        self.generation = 0

    def best_individual(self):
        self.best = min(self.fronts[0], key=operator.attrgetter('distance'))
        return min(self.fronts[0], key=operator.attrgetter('distance'))

    def create_individual(self, sequence):
        cost     = self.evaluate_cost(sequence)
        distance = self.evaluate_distance(sequence)
        return Individual(sequence, cost, distance)

    def create_initial_population(self):
        self.fronts = [[] for _ in range(self.population_size)]
        population  = [self.create_individual(self.generate_sequence(self.num_cities))
                       for _ in range(self.population_size)]
        self.fast_non_dominated_sort(self.fronts, population)

        offspring = []
        self.generate_individuals(population, offspring)

        population.extend(offspring)
        self.population = population
        self.fast_non_dominated_sort(self.fronts, self.population)

    def crossover_sequence_pmx(self, parent_sequence_a, parent_sequence_b):
        crossover_point = random.randint(0, len(parent_sequence_a))

        child_sequence_a = parent_sequence_a[:]
        child_sequence_b = parent_sequence_b[:]

        for i in range(crossover_point):
            x, y = child_sequence_a.index(parent_sequence_b[i]), child_sequence_b.index(parent_sequence_a[i])
            child_sequence_a[i], child_sequence_a[x] = child_sequence_a[x], child_sequence_a[i]
            child_sequence_b[i], child_sequence_b[y] = child_sequence_b[y], child_sequence_b[i]

        return child_sequence_a, child_sequence_b

    def crowding_distance_assignment(self, individuals):
        for i in individuals:
            i.crowding_distance = 0
            i.score             = 0

        individuals[0].score  = float('inf')
        individuals[-1].score = float('inf')

        individuals.sort(key=operator.attrgetter('distance'))

        individuals[0].crowding_distance  = float('inf')
        individuals[-1].crowding_distance = float('inf')

        distance_delta   = individuals[-1].distance - individuals[0].distance
        distance_scaling = 1 / distance_delta

        for i in range(1, len(individuals) - 1):
            individuals[i].crowding_distance += (
                (individuals[i + 1].distance - individuals[i - 1].distance) * distance_scaling)
            individuals[i].score += (individuals[i].distance - individuals[0].distance) / distance_delta

        individuals.sort(key=operator.attrgetter('cost'))

        individuals[0].crowding_distance  = float('inf')
        individuals[-1].crowding_distance = float('inf')

        cost_delta   = individuals[-1].cost - individuals[0].cost
        cost_scaling = 1 / cost_delta

        for i in range(1, len(individuals) - 1):
            individuals[i].crowding_distance += (
                (individuals[i + 1].cost - individuals[i - 1].cost) * cost_scaling)
#            individuals[i].score += (individuals[i].cost - individuals[0].cost) / cost_delta

    def dominates(self, a, b):
        return a.cost < b.cost and a.distance < b.distance

    def evaluate_cost(self, sequence):
        cost = 0

        from_city_id = sequence[0]
        for to_city_id in sequence[1:]:
            cost += self.costs[from_city_id, to_city_id]
            from_city_id = to_city_id

        cost += self.costs[from_city_id, sequence[0]]

        return cost

    def evaluate_distance(self, sequence):
        distance = 0

        from_city_id = sequence[0]
        for to_city_id in sequence[1:]:
            distance += self.distances[from_city_id, to_city_id]
            from_city_id = to_city_id

        distance += self.distances[from_city_id, sequence[0]]

        return distance

    def evolve(self):
        next_population = []
        i = 0

        while len(next_population) + len(self.fronts[i]) <= self.population_size:
            self.crowding_distance_assignment(self.fronts[i])
            next_population.extend(self.fronts[i])
            i += 1

        remaining = self.population_size - len(next_population)

        if remaining > 0:
            self.fronts[i].sort(key=functools.cmp_to_key(crowding_distance_operator))
            next_population.extend(self.fronts[i][:remaining])

        offspring = []
        self.generate_individuals(next_population, offspring)
        next_population.extend(offspring)
        self.population = next_population

        self.fast_non_dominated_sort(self.fronts, self.population)

        self.generation += 1

    def fast_non_dominated_sort(self, fronts, P):
        for front in fronts:
            front.clear()

        for p in P:
            p.S = []
            p.n = 0

            for q in P:
                if self.dominates(p, q):
                    p.S.append(q)
                elif self.dominates(q, p):
                    p.n += 1

            if p.n == 0:
                p.rank = 0
                fronts[0].append(p)

        front_index = 0

        while fronts[front_index]:
            for p in fronts[front_index]:
                for q in p.S:
                    q.n -= 1

                    if q.n == 0:
                        q.rank = front_index + 1
                        fronts[front_index + 1].append(q)

            front_index += 1

    def generate_individuals(self, population, offspring):
        while len(offspring) < len(population):
            parent_a = self.tournament_rank_selector(population)
            parent_b = self.tournament_rank_selector(population)

            if self.crossover_rate == 1 or random.random() < self.crossover_rate:
                child_a_sequence, child_b_sequence = self.crossover_sequence_pmx(
                    parent_a.sequence, parent_b.sequence)
            else:
                child_a_sequence, child_b_sequence = parent_a.sequence, parent_b.sequence

            child_a = self.create_individual(child_a_sequence)
            child_b = self.create_individual(child_b_sequence)

            if random.random() < self.mutation_rate:
                self.mutate_sequence(child_a.sequence)

            if random.random() < self.mutation_rate:
                self.mutate_sequence(child_b.sequence)

            offspring.append(child_a)
            offspring.append(child_b)

    def generate_sequence(self, num_cities):
        sequence = list(range(num_cities))
        random.shuffle(sequence)
        return sequence

    def mutate_sequence(self, sequence):
        a = random.randrange(len(sequence))
        b = random.randrange(len(sequence))
        sequence[a], sequence[b] = sequence[b], sequence[a]

    def tournament_crowding_distance_selector(self, individuals):
        group = random.sample(individuals, self.tournament_group_size)

        if random.random() >= self.tournament_randomness:
            return max(group, key=functools.cmp_to_key(crowding_distance_operator))
        else:
            return random.choice(group)

    def tournament_rank_selector(self, individuals):
        group = random.sample(individuals, self.tournament_group_size)

        if random.random() >= self.tournament_randomness:
            return max(group, key=functools.cmp_to_key(rank_operator))
        else:
            return random.choice(group)

class MtspPlotWidget(FigureCanvas):
    def __init__(self, parent=None):

        self.figure = Figure(figsize=(100, 100), dpi=100, facecolor='white')
        self.axes = self.figure.add_subplot(111)

        FigureCanvas.__init__(self, self.figure)
        self.setParent(parent)

        FigureCanvas.setSizePolicy(
            self, QSizePolicy.Expanding, QSizePolicy.Expanding)
        FigureCanvas.updateGeometry(self)

    def setFronts(self, fronts):
        colors = cm.rainbow(numpy.linspace(0, 1, 10))

        self.axes.hold(False)

        for i, front in enumerate(fronts):
            if front:
                count = collections.Counter((individual.distance, individual.cost) for individual in front)
                points, counts = zip(*count.items())
                x, y           = zip(*points)

                radii = 2
                sizes = [radii * count for count in counts]

                self.axes.scatter(x, y, s=counts, color=colors[min(i, 9)])
                self.axes.hold(True)

        self.draw()

class MtspWidget(QWidget):
    def __init__(self, parent=None):
        super(MtspWidget, self).__init__(parent)

        self.setStyleSheet('background-color:white;')
        self.setSizePolicy(QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding)
        self.updateGeometry()

        self.cost_colors = [QColor(color.hex_l) for color in colour.Color('green').range_to(colour.Color('red'), 101)]
        self.individual  = None

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.eraseRect(event.rect())

        painter.setFont(QFont("Roboto", 15));

        size = self.size()
        s_x = 0.9 * size.width() / (self.position_max[0] - self.position_min[0])
        s_y = 0.9 * size.height() / (self.position_max[1] - self.position_min[1])

        painter.setPen(QPen(QColor(51, 51, 51), 0))

        if self.individual:
            painter.drawText(QRect(0, 9 * size.height() / 10, size.width(), size.height() / 10),
                             Qt.AlignHCenter | Qt.AlignBottom,
                             'Generation: {} Cost: {} Distance: {}'.format(
                                self.generation, self.individual.cost, self.individual.distance))

        painter.translate(size.width() * 0.05, size.height() * 0.05)
        painter.scale(s_x, -s_y)
        painter.translate(-self.position_min[0], -self.position_max[1])

        radii = 4

        if self.individual:
            for i in range(len(self.individual.sequence)):
                from_city_id = self.individual.sequence[i]
                to_city_id   = self.individual.sequence[(i + 1) % len(self.individual.sequence)]

                cost  = self.costs[from_city_id, to_city_id]
                color = self.cost_colors[
                    int(round(100 * (cost - self.cost_min) / (self.cost_max - self.cost_min)))]

                painter.setPen(QPen(color, 8))
                painter.drawLine(QPointF(self.positions[from_city_id, 0], self.positions[from_city_id, 1]),
                                 QPointF(self.positions[to_city_id, 0],   self.positions[to_city_id, 1]))

        painter.setPen(QPen(QColor(51, 51, 51, 100), 0))
        painter.setBrush(QBrush(QColor(120, 118, 121)))

        for city in range(self.distances.shape[0]):
            pos = QPointF(self.positions[city, 0], self.positions[city, 1])

            painter.setBrush(QBrush(QColor(51, 51, 51)))
            painter.drawEllipse(pos, 1.3 * radii / s_x, 1.3 * radii / s_y)

            painter.setBrush(QBrush(QColor(120, 118, 121)))
            painter.drawEllipse(pos, radii / s_x, radii / s_y)

    def setData(self, generation, individual):
        self.generation = generation
        self.individual = individual
        self.update()

    def setValues(self, distances, costs):
        def compute_position(index):
            def validate_position(index):
                for i in range(index - 1):
                    n = numpy.linalg.norm(self.positions[index] - self.positions[i]) / self.distances[index, i]
                    if n > 1.01 or n < 0.99:
                        raise RuntimeError('failed to compute position for index {}'.format(index))

            a = self.distances[1, index]
            b = self.distances[0, index]
            c = self.distances[0, 1]

            alpha = math.acos((b * b + c * c - a * a) / (2 * b * c))

            try:
                self.positions[index, 0] = math.cos(alpha) * b
                self.positions[index, 1] = math.sin(alpha) * b

                validate_position(index)

                if index < self.distances.shape[0] - 1:
                    compute_position(index + 1)
            except:
                self.positions[index, 0] = math.cos(-alpha) * b
                self.positions[index, 1] = math.sin(-alpha) * b

                validate_position(index)

                if index < self.distances.shape[0] - 1:
                    compute_position(index + 1)

        self.distances = distances
        self.costs     = costs

        # Position of first city is 0,0
        # Position of second city is the distance between the first and second city, 0
        self.positions = numpy.zeros((distances.shape[0], 2))
        self.positions[1, 0] = self.distances[0, 1]

        compute_position(2)

        self.position_min = numpy.min(self.positions, axis=0)
        self.position_max = numpy.max(self.positions, axis=0)

        self.cost_min = numpy.min(self.costs)
        self.cost_max = numpy.max(self.costs)

        self.update()

    def sizeHint(self):
        return QSize(750, 750)

class MtspApplication(QMainWindow):
    def __init__(self):
        super(MtspApplication, self).__init__()

        self.initialize_group_box_control()

        self.play_thread = None
        self.is_playing  = False

        self.mtsp = Mtsp('../data/distance.csv', '../data/cost.csv')

        self.mtsp_widget = MtspWidget(self)
        self.mtsp_widget.setValues(self.mtsp.distances, self.mtsp.costs)

        self.first_plot  = MtspPlotWidget()
        self.second_plot = MtspPlotWidget()

        mtsp_widget_wrapper_layout = QHBoxLayout()
        mtsp_widget_wrapper_layout.addWidget(self.mtsp_widget)
        mtsp_widget_wrapper_groupbox = QGroupBox()
        mtsp_widget_wrapper_groupbox.setLayout(mtsp_widget_wrapper_layout)

        first_plot_wrapper_layout = QHBoxLayout()
        first_plot_wrapper_layout.addWidget(self.first_plot)
        first_plot_wrapper_groupbox = QGroupBox()
        first_plot_wrapper_groupbox.setLayout(first_plot_wrapper_layout)

        second_plot_wrapper_layout = QHBoxLayout()
        second_plot_wrapper_layout.addWidget(self.second_plot)
        second_plot_wrapper_groupbox = QGroupBox()
        second_plot_wrapper_groupbox.setLayout(second_plot_wrapper_layout)

        mtsp_widget_wrapper_groupbox.setStyleSheet('''QGroupBox {
            background-color: white;
            border: 1px solid black;
            padding: 0; margin: 0;
            }''')

        first_plot_wrapper_groupbox.setStyleSheet('''QGroupBox {
            background-color: white;
            border: 1px solid black;
            padding: 0; margin: 0;
            }''')

        second_plot_wrapper_groupbox.setStyleSheet('''QGroupBox {
            background-color: white;
            border: 1px solid black;
            padding: 0; margin: 0;
            }''')

        top_layout = QHBoxLayout()
        top_layout.addWidget(mtsp_widget_wrapper_groupbox)
        top_layout.addWidget(first_plot_wrapper_groupbox)
        top_layout.addWidget(second_plot_wrapper_groupbox)

        layout = QVBoxLayout()
        layout.addLayout(top_layout)
        layout.addWidget(self.group_box_control)

        widget = QWidget()
        widget.setLayout(layout)

        self.setWindowTitle('NTNU IT3708 2016 P5: Multi-Objective Traveling Salesman Problem -- permve@stud.ntnu.no')
        self.setCentralWidget(widget)
        self.show()

    def closeEvent(self, event):
        self.is_playing = False

        if self.play_thread:
            self.play_thread.join()

    def evolve(self):
        self.mtsp.population_size       = int(self.population_size.text())
        self.mtsp.generation_count      = int(self.generation_count.text())
        self.mtsp.crossover_rate        = float(self.crossover_rate.text())
        self.mtsp.mutation_rate         = float(self.mutation_rate.text())
        self.mtsp.tournament_group_size = int(self.tournament_group_size.text())
        self.mtsp.tournament_randomness = float(self.tournament_randomness.text())

        self.mtsp.create_initial_population()

        self.is_playing = True
        self.play_thread = threading.Thread(target=self.play)
        self.play_thread.start()

    def play(self):
        while self.is_playing and self.mtsp.generation < self.mtsp.generation_count:
            self.mtsp.evolve()
            b = self.mtsp.best_individual()
            self.mtsp_widget.setData(self.mtsp.generation, b)
            self.first_plot.setFronts(self.mtsp.fronts)
            time.sleep(0.2)

    def initialize_group_box_control(self):
        self.population_size       = QLineEdit('100')
        self.generation_count      = QLineEdit('100')
        self.tournament_group_size = QLineEdit('5')
        self.crossover_rate        = QLineEdit('1')
        self.mutation_rate         = QLineEdit('0.01')
        self.tournament_randomness = QLineEdit('0.1')

        first_column = QFormLayout()
        first_column.addRow('Population Size:',  self.population_size)
        first_column.addRow('Generation Count:', self.generation_count)
        first_column.addRow('Tournament Group Size:', self.tournament_group_size)

        second_column = QFormLayout()
        second_column.addRow('Crossover Rate:', self.crossover_rate)
        second_column.addRow('Mutation Rate:', self.mutation_rate)
        second_column.addRow('Tournament Randomness:', self.tournament_randomness)

        controls_row = QHBoxLayout()
        controls_row.addLayout(first_column)
        controls_row.addLayout(second_column)

        self.evolve_button = QPushButton('Evolve')

        buttons_row = QHBoxLayout()
        buttons_row.addWidget(self.evolve_button)

        layout = QVBoxLayout()
        layout.addLayout(controls_row)
        layout.addLayout(buttons_row)

        self.group_box_control = QGroupBox("Control")
        self.group_box_control.setLayout(layout)

        self.evolve_button.clicked.connect(self.evolve)

def main():
    app = QApplication(sys.argv)
    search_application = MtspApplication()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
