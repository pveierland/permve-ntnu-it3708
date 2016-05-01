#!/usr/bin/python3

import colour
import numpy

import math
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *

def read_matrix_file(filename):
    with open(filename) as matrix_file:
        num_cities = len(matrix_file.readline().split(',')) - 1
        values = numpy.zeros((num_cities, num_cities))

        for i in range(num_cities):
            row = list(float(value) for value in matrix_file.readline().split(',')[1:] if value.strip())
            values[i,:len(row)] = row
            values[:len(row),i] = row

        return values

class MtspWidget(QWidget):
    def __init__(self, parent=None):
        super(MtspWidget, self).__init__(parent)

        self.cost_colors = [QColor(color.hex_l) for color in colour.Color('green').range_to(colour.Color('red'), 101)]
        self.route = None

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing, True)

        painter.setBrush(QBrush(Qt.white))
        painter.drawRect(event.rect())

        size = self.size()
        s_x = 0.9 * size.width() / (self.position_max[0] - self.position_min[0])
        s_y = 0.9 * size.height() / (self.position_max[1] - self.position_min[1])

        painter.translate(size.width() * 0.05, size.height() * 0.05)
        painter.scale(s_x, -s_y)
        painter.translate(-self.position_min[0], -self.position_max[1])

        painter.setPen(QPen(Qt.black, 0))
        painter.setBrush(QBrush(Qt.black, Qt.SolidPattern))

        radii = 4

        if self.route:
            for i in range(len(self.route)):
                from_city_id = self.route[i]
                to_city_id   = self.route[(i + 1) % len(self.route)]

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

    def setRoute(self, route):
        self.route = route
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

#        top_layout = QVBoxLayout()
#        top_layout.addWidget(self.group_box_control)
#        top_layout.addStretch(1)
#
#        middle_layout = QHBoxLayout()
#        middle_layout.addWidget(self.vertex_coloring_widget)
#        middle_layout.addLayout(top_layout)
#
        self.mtsp_widget = MtspWidget(self)
        distances        = read_matrix_file('../data/distance.csv')
        costs            = read_matrix_file('../data/cost.csv')
        self.mtsp_widget.setValues(distances, costs)

        route = list(range(48))
        random.shuffle(route)
        self.mtsp_widget.setRoute(route)

        layout = QVBoxLayout()
        layout.addWidget(self.mtsp_widget)
        layout.addWidget(self.group_box_control)

#        layout.addLayout(middle_layout)
#        layout.addWidget(self.label_search_state)
#        layout.addWidget(self.label_search_nodes)
#
        widget = QWidget()
        widget.setLayout(layout)

        self.setWindowTitle('NTNU IT3708 2016 P5: Multi-Objective Traveling Salesman Problem -- permve@stud.ntnu.no')
        self.setCentralWidget(widget)
        self.show()

    def evolve(self):
        population_size  = int(self.population_size.text())
        generation_count = int(self.generation_count.text())
        crossover_rate   = float(self.crossover_rate.text())
        mutation_rate    = float(self.mutation_rate.text())

    def initialize_group_box_control(self):
        self.population_size  = QLineEdit('100')
        self.generation_count = QLineEdit('100')
        self.crossover_rate   = QLineEdit('1')
        self.mutation_rate    = QLineEdit('0.01')

        first_column = QFormLayout()
        first_column.addRow('Population Size:',  self.population_size)
        first_column.addRow('Generation Count:', self.generation_count)

        second_column = QFormLayout()
        second_column.addRow('Crossover Rate:', self.crossover_rate)
        second_column.addRow('Mutation Rate:', self.mutation_rate)

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
