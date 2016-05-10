#!/usr/bin/python3

import colour
import numpy

import argparse
import collections
import functools
import math
import operator
import random
import sys
import threading
import time

from nsga2 import Nsga2

#from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
#from matplotlib.figure import Figure
#from matplotlib import cm

#from PyQt5.QtCore import *
#from PyQt5.QtGui import *
#from PyQt5.QtWidgets import *

#def evaluate_cost(self, sequence):
#    cost = 0
#
#    from_city_id = sequence[0]
#    for to_city_id in sequence[1:]:
#        cost += self.costs[from_city_id, to_city_id]
#        from_city_id = to_city_id
#
#    cost += self.costs[from_city_id, sequence[0]]
#
#    return cost
#
#def evaluate_distance(self, sequence):
#    distance = 0
#
#    from_city_id = sequence[0]
#    for to_city_id in sequence[1:]:
#        distance += self.distances[from_city_id, to_city_id]
#        from_city_id = to_city_id
#
#    distance += self.distances[from_city_id, sequence[0]]
#
#    return distance

#def crossover_sequence_pmx(self, parent_sequence_a, parent_sequence_b):
#    child_sequence_a = parent_sequence_a[:]
#    child_sequence_b = parent_sequence_b[:]
#
#    crossover_points = sorted(random.sample(
#        range(len(parent_sequence_a)), self.crossover_points))
#
#    from_index = 0
#
#    for to_crossover_index in range(0, self.crossover_points, 2):
#        for i in range(from_index, crossover_points[to_crossover_index]):
#            x, y = child_sequence_a.index(parent_sequence_b[i]), child_sequence_b.index(parent_sequence_a[i])
#            child_sequence_a[i], child_sequence_a[x] = child_sequence_a[x], child_sequence_a[i]
#            child_sequence_b[i], child_sequence_b[y] = child_sequence_b[y], child_sequence_b[i]
#
#        if to_crossover_index < self.crossover_points - 1:
#            from_index = crossover_points[to_crossover_index + 1]
#
#    return child_sequence_a, child_sequence_b

class MtspPlotWidget(FigureCanvas):
    def __init__(self, parent=None):

        self.figure = Figure(figsize=(100, 100), dpi=100, facecolor='white')
        self.axes = self.figure.add_subplot(111)

        FigureCanvas.__init__(self, self.figure)
        self.setParent(parent)

        FigureCanvas.setSizePolicy(
            self, QSizePolicy.Expanding, QSizePolicy.Expanding)
        FigureCanvas.updateGeometry(self)

        self.colors = cm.rainbow(numpy.linspace(0, 1, 10))

    def setFronts(self, fronts):
        self.axes.hold(False)

        for i, front in enumerate(fronts):
            if front:
                count = collections.Counter(individual.objective_values for individual in front)
                points, counts = zip(*count.items())
                x, y           = zip(*points)

                radii = 3
                sizes = [radii * count for count in counts]

                self.axes.scatter(x, y, s=counts, color=self.colors[min(i, 9)])
                self.axes.hold(True)

        self.draw()

class MtspGraphWidget(QWidget):
    def __init__(self, parent=None):
        super(MtspGraphWidget, self).__init__(parent)

        self.setStyleSheet('background-color:white;')
        self.setSizePolicy(QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding)
        self.updateGeometry()

        self.cost_colors = [QColor(color.hex_l) for color in colour.Color('green').range_to(colour.Color('red'), 101)]
        self.individual  = None

    def paintEvent(self, event):
        def draw_line(from_city_id, to_city_id):
            cost  = self.costs[from_city_id, to_city_id]
            color = self.cost_colors[
                int(round(100 * (cost - self.cost_min) / (self.cost_max - self.cost_min)))]

            painter.setPen(QPen(color, 8))
            painter.drawLine(QPointF(self.positions[from_city_id, 0], self.positions[from_city_id, 1]),
                             QPointF(self.positions[to_city_id, 0],   self.positions[to_city_id, 1]))

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
                                self.generation, self.individual.objective_values[1], self.individual.objective_values[0]))

        painter.translate(size.width() * 0.05, size.height() * 0.05)
        painter.scale(s_x, -s_y)
        painter.translate(-self.position_min[0], -self.position_max[1])

        radii = 4

        if self.individual:
            from_city_id = 0

            for to_city_id in self.individual.genotype:
                draw_line(from_city_id, to_city_id)
                from_city_id = to_city_id

            draw_line(from_city_id, 0)

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
        return QSize(200, 200)

class MtspApplication(QMainWindow):
    def __init__(self, mtsp):
        super(MtspApplication, self).__init__()

        self.initialize_controls_group_box()

        self.play_thread = None
        self.is_playing  = False

        self.mtsp = mtsp

        self.mtsp_graph_widget_cost = MtspGraphWidget(self)
        self.mtsp_graph_widget_cost.setValues(self.mtsp.distances, self.mtsp.costs)

        self.mtsp_graph_widget_distance = MtspGraphWidget(self)
        self.mtsp_graph_widget_distance.setValues(self.mtsp.distances, self.mtsp.costs)

        self.mtsp_plot_widget_population    = MtspPlotWidget()
        self.mtsp_plot_widget_non_dominated = MtspPlotWidget()

        def add_border(widget):
            layout = QHBoxLayout()
            layout.addWidget(widget)

            group_box = QGroupBox()
            group_box.setLayout(layout)
            group_box.setStyleSheet('''QGroupBox {
                background-color: white;
                border: 1px solid black;
                padding: 0; margin: 0;
                }''')

            return group_box

        main_layout = QGridLayout()
        main_layout.addWidget(add_border(self.mtsp_graph_widget_distance), 0, 0, 1, 1)
        main_layout.addWidget(add_border(self.mtsp_graph_widget_cost), 1, 0, 1, 1)
        main_layout.addWidget(add_border(self.mtsp_plot_widget_population), 0, 1, 1, 1)
        main_layout.addWidget(add_border(self.mtsp_plot_widget_non_dominated), 1, 1, 1, 1)
        main_layout.addWidget(self.controls_group_box, 0, 2, 2, 1)

        main_layout.setColumnStretch(0, 1)
        main_layout.setColumnStretch(1, 1)

        main_widget = QWidget()
        main_widget.setLayout(main_layout)

        self.setWindowTitle('NTNU IT3708 2016 P5: Multi-Objective Traveling Salesman Problem -- permve@stud.ntnu.no')
        self.setCentralWidget(main_widget)
        self.show()

        self.best_cost     = None
        self.best_distance = None

    def closeEvent(self, event):
        self.is_playing = False

        if self.play_thread:
            self.play_thread.join()

    def evolve(self):
        if self.is_playing:
            self.is_playing = False
            self.play_thread.join()

        self.mtsp.initialize({
            'objective_count':       2,
            'population_size':       int(self.population_size.text()),
            'generation_count':      int(self.generation_count.text()),
            'crossover_rate':        float(self.crossover_rate.text()),
            'crossover_points':      int(self.crossover_points.text()),
            'mutation_rate':         float(self.mutation_rate.text()),
            'tournament_group_size': int(self.tournament_group_size.text()),
            'tournament_randomness': float(self.tournament_randomness.text())
        })

        self.is_playing = True
        self.play_thread = threading.Thread(target=self.play)
        self.play_thread.start()

    def play(self):
        while self.is_playing and self.mtsp.nsga2.generation < self.mtsp.nsga2.options['generation_count']:
            self.mtsp.nsga2.evolve()

            if self.best_distance:
                if self.mtsp.nsga2.extreme_min[0] > self.best_distance:
                    print('distance regression {} -> {}'.format(self.best_distance, self.mtsp.nsga2.extreme_min[1]))

            if self.best_cost:
                if self.mtsp.nsga2.extreme_min[1] > self.best_cost:
                    print('cost regression {} -> {}'.format(self.best_cost, self.mtsp.nsga2.extreme_min[1]))

            self.mtsp_graph_widget_distance.setData(self.mtsp.nsga2.generation, self.mtsp.nsga2.extreme_min[0])
            self.mtsp_graph_widget_cost.setData(self.mtsp.nsga2.generation, self.mtsp.nsga2.extreme_min[1])

            self.mtsp_plot_widget_population.setFronts(self.mtsp.nsga2.fronts)
            self.mtsp_plot_widget_non_dominated.setFronts([self.mtsp.nsga2.fronts[0]])

            time.sleep(0.2)

        self.is_playing = False

    def initialize_controls_group_box(self):
        self.population_size       = QLineEdit('500')
        self.generation_count      = QLineEdit('100')
        self.tournament_group_size = QLineEdit('20')
        self.crossover_rate        = QLineEdit('1')
        self.crossover_points      = QLineEdit('5')
        self.mutation_rate         = QLineEdit('0.01')
        self.tournament_randomness = QLineEdit('0.1')

        form_layout = QFormLayout()
        form_layout.addRow('Population Size:',  self.population_size)
        form_layout.addRow('Generation Count:', self.generation_count)
        form_layout.addRow('Tournament Group Size:', self.tournament_group_size)
        form_layout.addRow('Tournament Randomness:', self.tournament_randomness)
        form_layout.addRow('Crossover Points:', self.crossover_points)
        form_layout.addRow('Crossover Rate:', self.crossover_rate)
        form_layout.addRow('Mutation Rate:', self.mutation_rate)

        self.evolve_button = QPushButton('Evolve')

        layout = QVBoxLayout()
        layout.addLayout(form_layout)
        layout.addWidget(self.evolve_button)
        layout.addStretch(1)

        self.controls_group_box = QGroupBox("Control")
        self.controls_group_box.setLayout(layout)

        self.evolve_button.clicked.connect(self.evolve)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--generations', type=int)
    parser.add_argument('--crossover_rate', type=float)
    parser.add_argument('--mutation_rate', type=float)
    parser.add_argument('--population', type=int)
    parser.add_argument('--tournament_group_size', type=int)
    parser.add_argument('--tournament_randomness', type=float)
    parser.add_argument('--nogui', action='store_true')
    args = parser.parse_args()

    print(args)

    mtsp = Mtsp('../data/distance.csv', '../data/cost.csv')

    if args.nogui:
        mtsp.initialize({
            'objective_count':       2,
            'population_size':       args.population,
            'generation_count':      args.generations,
            'crossover_rate':        args.crossover_rate,
            'mutation_rate':         args.mutation_rate,
            'tournament_group_size': args.tournament_group_size,
            'tournament_randomness': args.tournament_randomness
        })

        for _ in range(args.generations):
            mtsp.nsga2.evolve()
            print('generation: {} distance: {} cost: {}'.format(
                mtsp.nsga2.generation,
                mtsp.nsga2.extreme_min[0].objective_values[0],
                mtsp.nsga2.extreme_min[1].objective_values[1]))

    else:
        app = QApplication(sys.argv)
        search_application = MtspApplication(mtsp)
        sys.exit(app.exec_())

if __name__ == '__main__':
    main()
