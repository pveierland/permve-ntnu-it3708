import math

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

import jssp.types

def parse_problem_file(filename):
    with open(filename) as input_file:
        input_lines = input_file.readlines()
        job_count, machine_count = map(int, input_lines[0].split())
        jobs = []

        for job_index in range(job_count):
            input_line = list(map(int, input_lines[job_index + 1].split()))
            jobs.append([
                jssp.types.Operation(job_index * machine_count + machine_index, job_index, machine_index, job_sequence_index, time_steps)
                for job_sequence_index, (machine_index, time_steps) in enumerate(zip(input_line[0::2], input_line[1::2]))])

        return jssp.types.Problem(job_count, machine_count, jobs)

def render_gantt_chart(output_filename, allocations):
    if not allocations:
        allocations = [
            [jssp.types.Allocation(0, 1,  6,  3), jssp.types.Allocation(3, 1, 13, 5), jssp.types.Allocation(2, 3, 18,  9), jssp.types.Allocation(5, 3, 28, 10), jssp.types.Allocation(1, 4, 38, 10), jssp.types.Allocation(4, 4, 48, 3)],
            [jssp.types.Allocation(1, 0,  0,  8), jssp.types.Allocation(3, 0,  8, 5), jssp.types.Allocation(5, 0, 13,  3), jssp.types.Allocation(0, 2, 16,  6), jssp.types.Allocation(4, 1, 22,  3), jssp.types.Allocation(2, 4, 27, 1)],
            [jssp.types.Allocation(2, 0,  0,  5), jssp.types.Allocation(0, 0,  5, 1), jssp.types.Allocation(1, 1,  8,  5), jssp.types.Allocation(4, 0, 13,  9), jssp.types.Allocation(3, 2, 22,  5), jssp.types.Allocation(5, 5, 49, 1)],
            [jssp.types.Allocation(2, 1,  5,  4), jssp.types.Allocation(5, 1, 16, 3), jssp.types.Allocation(3, 3, 27,  3), jssp.types.Allocation(0, 3, 30,  7), jssp.types.Allocation(1, 5, 48,  4), jssp.types.Allocation(4, 5, 52, 1)],
            [jssp.types.Allocation(1, 2, 13, 10), jssp.types.Allocation(4, 2, 25, 5), jssp.types.Allocation(3, 4, 30,  8), jssp.types.Allocation(2, 5, 38,  7), jssp.types.Allocation(5, 4, 45,  4), jssp.types.Allocation(0, 5, 49, 6)],
            [jssp.types.Allocation(2, 2,  9,  8), jssp.types.Allocation(5, 2, 19, 9), jssp.types.Allocation(1, 3, 28, 10), jssp.types.Allocation(0, 4, 38,  3), jssp.types.Allocation(4, 3, 41,  4), jssp.types.Allocation(3, 5, 45, 9)]]

    configuration = {
        'block_height_ratio': 0.7,
        'bottom_margin': 1.5,
        'box_line_thickness': 0.05,
        'cell_height': 4.0,
        'left_margin': 2.5,
        'major_grid_line_text_spacing': 1.5,
        'major_grid_resolution': 5,
        'major_line_thickness': 0.05,
        'minor_line_thickness': 0.03,
        'right_margin': 1.0,
        'top_margin': 0.5
    }

    colors = {
        'box_line':   QColor(51, 51, 51),
        'major_line': QColor(51, 51, 51, 200),
        'minor_line': QColor(51, 51, 51, 100),
        'path':       QColor(51, 51, 51),
        'text':       QColor(60, 60, 60)
    }

    # http://colorbrewer2.org/?type=qualitative&scheme=Set3&n=12
    # http://colorbrewer2.org/?type=qualitative&scheme=Paired&n=12
    job_colors = [QColor(c) for c in [
        '#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5','#ffed6f',
        '#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#ffff99','#b15928']]

    num_machines = len(allocations)

    max_time_step = max(allocation.start_time + allocation.operation.time_steps
                        for machine_allocations in allocations
                        for allocation in machine_allocations)

    width  = int(math.ceil(max_time_step / configuration['major_grid_resolution']) * configuration['major_grid_resolution'])
    height = num_machines * configuration['cell_height']

    app = QApplication([ '-platform', 'offscreen'])

    printer = QPrinter()
    printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(output_filename)
    printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)

    printer.setPageSize(QPageSize(
        QSizeF(width  + configuration['left_margin'] + configuration['right_margin'],
               height + configuration['top_margin']  + configuration['bottom_margin']),
        QPageSize.Inch))

    painter = QPainter(printer)
    painter.setRenderHint(QPainter.Antialiasing)
    painter.setRenderHint(QPainter.HighQualityAntialiasing)
    painter.scale(printer.resolution(), printer.resolution())
    painter.translate(configuration['left_margin'], configuration['top_margin'])

    regular_font = painter.font()
    regular_font.setPixelSize(1)
    painter.setFont(regular_font)

    bold_font = painter.font()
    bold_font.setWeight(QFont.DemiBold)

    major_grid = QPainterPath()
    minor_grid = QPainterPath()

    painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

    for x in range(width + 1):
        is_major_grid_line = x % configuration['major_grid_resolution'] == 0
        grid = major_grid if is_major_grid_line else minor_grid
        grid.moveTo(float(x), 0.0)
        grid.lineTo(float(x), height)

        if is_major_grid_line:
            major_grid_line_text = str(x)
            major_grid_line_text_rect = painter.fontMetrics().boundingRect(major_grid_line_text)
            painter.save()
            painter.translate(x - major_grid_line_text_rect.width() / 2.0, height + configuration['major_grid_line_text_spacing'] - major_grid_line_text_rect.height() / 2.0)
            painter.drawText(major_grid_line_text_rect, Qt.AlignCenter, str(x))
            painter.restore()

    for k in range(num_machines + 1):
        y = configuration['cell_height'] * k
        major_grid.moveTo(0.0, y)
        major_grid.lineTo(float(width), y)

    painter.setPen(QPen(colors['minor_line'], configuration['minor_line_thickness']))
    painter.drawPath(minor_grid)

    painter.setPen(QPen(colors['major_line'], configuration['major_line_thickness']))
    painter.drawPath(major_grid)

    for machine_index, machine_allocations in enumerate(allocations):
        machine_text_rect = QRectF(-configuration['left_margin'], configuration['cell_height'] * machine_index, configuration['left_margin'], configuration['cell_height'])
        painter.setFont(bold_font)
        painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))
        painter.drawText(machine_text_rect, Qt.AlignCenter, 'M{}'.format(machine_index + 1))

        for allocation in machine_allocations:
            rect = QRectF(
                float(allocation.start_time),
                (float(machine_index) + (1.0 - configuration['block_height_ratio']) / 2.0) * configuration['cell_height'],
                float(allocation.operation.time_steps),
                configuration['block_height_ratio'] * configuration['cell_height'])

            painter.setPen(QPen(colors['box_line'], configuration['box_line_thickness']))
            painter.fillRect(rect, QBrush(job_colors[allocation.operation.job % len(job_colors)]))
            painter.drawRect(rect)

            text = '({}/{})'.format(allocation.job_sequence_index + 1, allocation.operation.job + 1)
            text_width = painter.fontMetrics().width(text)
            painter.setFont(regular_font)
            painter.setPen(QPen(colors['text'], configuration['box_line_thickness']))

            if text_width > 0.8 * rect.width():
                text_rect = rect.translated(QPointF(-0.1, 0.05))
                painter.save()
                painter.translate(text_rect.center())
                painter.rotate(-90)
                painter.scale(0.7, 0.7)
                painter.drawText(QRectF(-text_rect.height() / 2.0, -text_rect.width() / 2.0, text_rect.height(), text_rect.width()), Qt.AlignCenter, text)
                painter.restore()
            else:
                text_rect = rect.translated(QPointF(0.05, -0.15))
                painter.drawText(text_rect, Qt.AlignCenter, text)

    painter.end()