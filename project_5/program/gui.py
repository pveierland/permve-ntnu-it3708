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

from mtsp import Mtsp
from nsga2 import Nsga2

from matplotlib.backends.backend_qt5agg import FigureCanvasQTAgg as FigureCanvas
from matplotlib.figure import Figure
from matplotlib import cm

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *

class MtspPlotWidget(FigureCanvas):
    def __init__(self, parent=None, title=None):

        self.title      = title
        self.total      = 0
        self.radii      = 3
        self.generation = 0

        self.figure = Figure(figsize=(100, 100), dpi=100, facecolor='white')
        self.axes = self.figure.add_subplot(111)

        FigureCanvas.__init__(self, self.figure)
        self.setParent(parent)

        FigureCanvas.setSizePolicy(
            self, QSizePolicy.Expanding, QSizePolicy.Expanding)
        FigureCanvas.updateGeometry(self)

        self.colors = cm.rainbow(numpy.linspace(0, 1, 10))

    def paintEvent(self, event):
        FigureCanvas.paintEvent(self, event)

        if self.title:
            painter = QPainter(self)
            painter.setRenderHint(QPainter.Antialiasing, True)

            size = self.size()

            painter.setPen(QPen(QColor(51, 51, 51), 0))

            painter.setFont(QFont("Open Sans", 15));
            painter.drawText(QRect(0, 10, size.width(), size.height() / 10),
                             Qt.AlignHCenter | Qt.AlignTop,
                             '{} ({})'.format(self.title, self.total))

            painter.setFont(QFont("Open Sans", 12));
            painter.drawText(QRect(0, 9 * size.height() / 10, size.width(), size.height() / 10),
                             Qt.AlignHCenter | Qt.AlignBottom,
                             'Generation = {}'.format(self.generation))

    def setData(self, generation, fronts, best, worst):
        self.axes.hold(False)

        self.generation = generation
        total = 0

        best_distance_count  = 0
        best_cost_count      = 0
        worst_distance_count = 0
        worst_cost_count     = 0

        for i, front in enumerate(fronts):
            if front:
                total += len(front)

                count = collections.Counter(individual.objective_values for individual in front)
                points, counts = zip(*count.items())
                x, y           = zip(*points)

                best_distance_count  = max(best_distance_count, count[best[0].objective_values])
                best_cost_count      = max(best_cost_count, count[best[1].objective_values])
                worst_distance_count = max(worst_distance_count, count[worst[0].objective_values])
                worst_cost_count     = max(worst_cost_count, count[worst[1].objective_values])

                sizes = [self.radii * count for count in counts]

                self.axes.scatter(x, y, s=counts, color=self.colors[min(i, 9)])
                self.axes.hold(True)

        self.total = total

        if best_distance_count:
            self.axes.plot(best[0].objective_values[0],
                           best[0].objective_values[1],
                           'o', markeredgewidth=1, markeredgecolor='r', markerfacecolor='None',
                           markersize=math.sqrt(self.radii * best_distance_count) + 6)

        if best_cost_count:
            self.axes.plot(best[1].objective_values[0],
                           best[1].objective_values[1],
                           'o', markeredgewidth=1, markeredgecolor='r', markerfacecolor='None',
                           markersize=math.sqrt(self.radii * best_cost_count) + 6)

        if worst_distance_count:
            self.axes.plot(worst[0].objective_values[0],
                           worst[0].objective_values[1],
                           's', markeredgewidth=1, markeredgecolor='b', markerfacecolor='None',
                           markersize=math.sqrt(self.radii * worst_distance_count) + 9)

        if worst_cost_count:
            self.axes.plot(worst[1].objective_values[0],
                           worst[1].objective_values[1],
                           's', markeredgewidth=1, markeredgecolor='b', markerfacecolor='None',
                           markersize=math.sqrt(self.radii * worst_cost_count) + 9)

        self.draw()

class MtspGraphWidget(QWidget):
    def __init__(self, parent=None, best_title=None, worst_title=None):
        super(MtspGraphWidget, self).__init__(parent)

        self.best_title  = best_title
        self.worst_title = worst_title

        self.setStyleSheet('background-color:white;')
        self.setSizePolicy(QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding)
        self.updateGeometry()

        self.cost_colors      = [QColor(color.hex_l) for color in colour.Color('green').range_to(colour.Color('red'), 20)]
        self.best_individual  = None
        self.worst_individual = None

    def paintEvent(self, event):
        def draw_line(from_city_id, to_city_id):
            distance        = self.distances[from_city_id, to_city_id]
            cost            = self.costs[from_city_id, to_city_id]
            normalized_cost = cost / distance

            color_index = int(round((len(self.cost_colors) - 1) *
                (normalized_cost - self.cost_per_distance_min) * self.cost_per_distance_normalizer))
            color_index = min(color_index * color_index, len(self.cost_colors) - 1)
            color = self.cost_colors[color_index]

            painter.setPen(QPen(color, 8))
            painter.drawLine(QPointF(self.positions[from_city_id, 0], self.positions[from_city_id, 1]),
                             QPointF(self.positions[to_city_id, 0],   self.positions[to_city_id, 1]))

        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)
        painter.eraseRect(event.rect())

        painter.setFont(QFont("Open Sans", 15));

        size = self.size()
        s_x = 0.8 * size.width() / (self.position_max[0] - self.position_min[0])
        s_y = 0.8 * size.height() / (self.position_max[1] - self.position_min[1])

        painter.setPen(QPen(QColor(51, 51, 51), 0))

        painter.drawText(
            QRect(0, 5, size.width(), size.height() / 10),
            Qt.AlignHCenter | Qt.AlignTop,
            self.best_title)

        painter.setFont(QFont("Open Sans", 11));

        if self.best_individual:
            painter.drawText(
                QRect(0, 9.1 * size.height() / 10 + 2, size.width(), size.height() / 10),
                Qt.AlignHCenter | Qt.AlignTop,
                '{}: Cost = {} Distance = {}'.format(
                    self.best_title,
                    self.best_individual.objective_values[1],
                    self.best_individual.objective_values[0]))

        if self.worst_individual:
            painter.drawText(
                QRect(0, 9.1 * size.height() / 10 - 4, size.width(), size.height() / 10),
                Qt.AlignHCenter | Qt.AlignBottom,
                '{}: Cost = {} Distance = {}'.format(
                    self.worst_title,
                    self.worst_individual.objective_values[1],
                    self.worst_individual.objective_values[0]))

        painter.translate(size.width() * 0.1, size.height() * 0.1)
        painter.scale(s_x, -s_y)
        painter.translate(-self.position_min[0], -self.position_max[1])

        radii = 4

        if self.best_individual:
            from_city_id = self.best_individual.genotype[0]

            for to_city_id in self.best_individual.genotype[1:]:
                draw_line(from_city_id, to_city_id)
                from_city_id = to_city_id

            draw_line(from_city_id, self.best_individual.genotype[0])

        painter.setPen(QPen(QColor(51, 51, 51, 100), 0))
        painter.setBrush(QBrush(QColor(120, 118, 121)))

        for city in range(self.distances.shape[0]):
            pos = QPointF(self.positions[city, 0], self.positions[city, 1])

            painter.setBrush(QBrush(QColor(51, 51, 51)))
            painter.drawEllipse(pos, 1.3 * radii / s_x, 1.3 * radii / s_y)

            painter.setBrush(QBrush(QColor(120, 118, 121)))
            painter.drawEllipse(pos, radii / s_x, radii / s_y)

    def setData(self, best_individual, worst_individual):
        self.best_individual  = best_individual
        self.worst_individual = worst_individual
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

        cost_per_distance_max = float('-inf')
        cost_per_distance_min = float('+inf')

        for i in range(distances.shape[0]):
            for j in range(i + 1, distances.shape[0]):
                distance        = distances[i, j]
                cost            = costs[i, j]
                normalized_cost = cost / distance

                cost_per_distance_max = max(cost_per_distance_max, normalized_cost)
                cost_per_distance_min = min(cost_per_distance_min, normalized_cost)

        self.cost_per_distance_max = cost_per_distance_max
        self.cost_per_distance_min = cost_per_distance_min
        self.cost_per_distance_normalizer = 1 / (self.cost_per_distance_max - self.cost_per_distance_min)

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

        self.mtsp_graph_widget_cost = MtspGraphWidget(
            self, best_title='Lowest cost solution', worst_title='Highest cost solution')
        self.mtsp_graph_widget_cost.setValues(self.mtsp.distances, self.mtsp.costs)

        self.mtsp_graph_widget_distance = MtspGraphWidget(
            self, best_title='Shortest path solution', worst_title='Longest path solution')
        self.mtsp_graph_widget_distance.setValues(self.mtsp.distances, self.mtsp.costs)

        self.mtsp_plot_widget_population    = MtspPlotWidget(title='Population')
        self.mtsp_plot_widget_non_dominated = MtspPlotWidget(title='Non-dominated front')

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

            self.mtsp_graph_widget_distance.setData(self.mtsp.nsga2.extreme_min[0], self.mtsp.nsga2.extreme_max[0])
            self.mtsp_graph_widget_cost.setData(self.mtsp.nsga2.extreme_min[1], self.mtsp.nsga2.extreme_max[1])

            self.mtsp_plot_widget_population.setData(
                self.mtsp.nsga2.generation, self.mtsp.nsga2.fronts, self.mtsp.nsga2.extreme_min, self.mtsp.nsga2.extreme_max)
            self.mtsp_plot_widget_non_dominated.setData(
                self.mtsp.nsga2.generation, [self.mtsp.nsga2.fronts[0]], self.mtsp.nsga2.extreme_min, self.mtsp.nsga2.extreme_max)

            time.sleep(0.2)

        self.is_playing = False

    def initialize_controls_group_box(self):
        self.population_size       = QLineEdit('1000')
        self.generation_count      = QLineEdit('1000')
        self.tournament_group_size = QLineEdit('200')
        self.crossover_rate        = QLineEdit('1.0')
        self.mutation_rate         = QLineEdit('0.05')
        self.tournament_randomness = QLineEdit('0.1')

        form_layout = QFormLayout()
        form_layout.addRow('Population Size:',  self.population_size)
        form_layout.addRow('Generation Count:', self.generation_count)
        form_layout.addRow('Tournament Group Size:', self.tournament_group_size)
        form_layout.addRow('Tournament Randomness:', self.tournament_randomness)
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
    mtsp = Mtsp.build('../data/distance.csv', '../data/cost.csv')
    app = QApplication(sys.argv)
    search_application = MtspApplication(mtsp)
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
