#!/usr/bin/python3

import argparse
import collections
import enum
import numpy
import numpy as np
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

class FlatlandEntity(enum.IntEnum):
    FOOD     = 1
    OBSTACLE = 2
    OPEN     = 3
    POISON   = 4

def render(output_filename, world, path):
    app = QApplication([ '-platform', 'offscreen'])

    cell_size     = 50
    text_size     = 10
    symbol_size   = 25
    margin_size   = 5

    colors = {
        'line':    QColor(51, 51, 51),
        'blocked': QColor(100, 100, 100),
        'food':    QColor(0, 220, 0),
        'poison':  QColor(220, 0, 0)
        FlatlandEntity.
    }

    printer = QPrinter()
    printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(output_filename)
    printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)
    printer.setPageSize(QPageSize(
        QSizeF(float((world.width  + 2) * cell_size + 2 * margin_size) / printer.resolution(),
               float((world.height + 2) * cell_size + 2 * margin_size) / printer.resolution()),
        QPageSize.Inch))

    painter = QPainter(printer)
    painter.translate(margin_size, margin_size)
    painter.setPen(QPen(colors['line'], 0))

    for y in range(world.height + 3):
        painter.drawLine(0,
                         cell_size * y,
                         cell_size * (world.width + 2),
                         cell_size * y)

    for x in range(world.width + 3):
        painter.drawLine(cell_size * x,
                         0,
                         cell_size * x,
                         cell_size * (world.height + 2))

    painter.setBrush(QBrush(colors['egg']))

    for row in range(world.height + 2):
        for column in range(world.width + 2):
            if row % (world.height + 1) == 0 or column % (world.width + 1) == 0:
                cell = FlatlandEntity.OBSTACLE

                painter.drawEllipse(
                    QPointF(cell_size * (column + 0.5),
                            cell_size * (row + 0.5)),
                    float(cell_size) / 4,
                    float(cell_size) / 4)

    painter.end()

class FlatlandWorld(object):
    def __init__(self, width, height):
        self.state = np.full((width, height), FlatlandEntity.OPEN, dtype=int)

def main():
    parser = argparse.ArgumentParser()
    #parser.add_argument('--max_epochs', type=int)
    #parser.add_argument('--start_temperature', type=float)
    #parser.add_argument('--delta_temperature', type=float)
    parser.add_argument('--pdf', metavar='output_filename', default='x.pdf')
    args = parser.parse_args()

    world = FlatlandWorld(3, 3)

    if args.pdf:
        render(args.pdf, world, None)

if __name__ == '__main__':
    main()
