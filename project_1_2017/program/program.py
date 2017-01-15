#!/usr/bin/env python3

import argparse
import collections
import enum
import numpy as np
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

class FlatlandAction(enum.IntEnum):
    MOVE_LEFT    = 0
    MOVE_FORWARD = 1
    MOVE_RIGHT   = 2

class FlatlandHeading(enum.IntEnum):
    NORTH = 0
    EAST  = 1
    SOUTH = 2
    WEST  = 3

class FlatlandEntity(enum.IntEnum):
    OPEN         = 1
    OBSTACLE     = 2
    FOOD         = 3
    FOOD_EATEN   = 4
    POISON       = 5
    POISON_EATEN = 6

class BaselineAgent(object):
    def __init__(self):
        pass

    def act(self, percepts):
        actions = list(FlatlandAction)

        food_actions = [
            action for action in actions
            if percepts[action][0] == FlatlandEntity.FOOD]

        neutral_actions = [
            action for action in actions
            if percepts[action][0] != FlatlandEntity.OBSTACLE and
               percepts[action][0] != FlatlandEntity.POISON]

        poison_actions = [
            action for action in actions
            if percepts[action][0] == FlatlandEntity.POISON]

        # Move forward by default:
        return (food_actions + neutral_actions + poison_actions +
                [FlatlandAction.MOVE_FORWARD])[0]

class RandomAgent(object):
    def __init__(self):
        pass

    def act(self, percepts):
        return np.random.choice(list(FlatlandAction))

def create_world(width, height, food_ratio, poison_ratio):
    world = np.full((width, height), FlatlandEntity.OPEN, dtype=int)

    # Add obstacle border
    world[ 0, :] = FlatlandEntity.OBSTACLE
    world[-1, :] = FlatlandEntity.OBSTACLE
    world[ :, 0] = FlatlandEntity.OBSTACLE
    world[ :,-1] = FlatlandEntity.OBSTACLE

    world[np.where(np.logical_and(
        world == FlatlandEntity.OPEN,
        np.random.choice([True, False], world.shape, p=[food_ratio, 1.0 - food_ratio])))] \
             = FlatlandEntity.FOOD

    world[np.where(np.logical_and(
        world == FlatlandEntity.OPEN,
        np.random.choice([True, False], world.shape, p=[poison_ratio, 1.0 - poison_ratio])))] \
            = FlatlandEntity.POISON

    agent_position = list(zip(*np.where(world == FlatlandEntity.OPEN)))[0]
    agent_heading  = np.random.choice(list(FlatlandHeading))

    return world, agent_position, agent_heading

def evaluate_agent(world, steps, sensor_range, agent, agent_position, agent_heading):
    world = np.copy(world)

    rewards = {
        FlatlandEntity.OPEN:            0,
        FlatlandEntity.OBSTACLE:     -100,
        FlatlandEntity.FOOD:            4,
        FlatlandEntity.FOOD_EATEN:      0,
        FlatlandEntity.POISON:         -1,
        FlatlandEntity.POISON_EATEN:    0
    }

    padded_world = np.zeros(
        (world.shape[0] + 2 * sensor_range, world.shape[1] + 2 * sensor_range))

    points           = 0
    position_history = [agent_position]
    action_history   = []

    while steps > 0:
        # Construct perception
        padded_world[sensor_range:sensor_range + world.shape[0],
                     sensor_range:sensor_range + world.shape[1]] = world

        agent_perception = np.rot90(
            padded_world[agent_position[0]:agent_position[0] + 2 * sensor_range + 1,
                         agent_position[1]:agent_position[1] + 2 * sensor_range + 1],
            agent_heading)

        # Get agent action
        action = agent.act((
            agent_perception[sensor_range, sensor_range - 1::-1],
            agent_perception[sensor_range - 1::-1, sensor_range],
            agent_perception[sensor_range, sensor_range + 1:]))

        action_history.append(action)

        # Update agent heading
        if action == FlatlandAction.MOVE_LEFT:
            agent_heading = (agent_heading + 4 - 1) % 4
        elif action == FlatlandAction.MOVE_RIGHT:
            agent_heading = (agent_heading + 1) % 4

        # Update agent position
        if agent_heading == FlatlandHeading.NORTH:
            agent_position = (agent_position[0] - 1, agent_position[1])
        elif agent_heading == FlatlandHeading.EAST:
            agent_position = (agent_position[0], agent_position[1] + 1)
        elif agent_heading == FlatlandHeading.SOUTH:
            agent_position = (agent_position[0] + 1, agent_position[1])
        elif agent_heading == FlatlandHeading.WEST:
            agent_position = (agent_position[0], agent_position[1] - 1)

        agent_position = (np.clip(agent_position[0], 0, world.shape[0] - 1),
                          np.clip(agent_position[1], 0, world.shape[1] - 1))

        position_history.append(agent_position)

        entity  = world[agent_position]
        points += rewards[entity]

        if entity == FlatlandEntity.OBSTACLE:
            break
        elif entity == FlatlandEntity.FOOD:
            world[agent_position] = FlatlandEntity.FOOD_EATEN
        elif entity == FlatlandEntity.POISON:
            world[agent_position] = FlatlandEntity.POISON_EATEN

        steps -= 1

    return world, position_history, action_history, points

def render(output_filename, world, agent_path):
    app = QApplication([ '-platform', 'offscreen'])

    cell_size   = 50
    margin_size = 5
    symbol_size = 0.35

    colors = {
        'line':                      QColor( 51,  51,  51),
        'path':                      QColor( 51,  51,  51),
        FlatlandEntity.OBSTACLE:     QColor( 88,  89,  91),
        FlatlandEntity.FOOD:         QColor( 28, 150,  32),
        FlatlandEntity.FOOD_EATEN:   QColor(135, 243, 132),
        FlatlandEntity.POISON:       QColor(255, 153,   0),
        FlatlandEntity.POISON_EATEN: QColor(204,  51, 102)
    }

    printer = QPrinter()
    printer.setOutputFormat(QPrinter.PdfFormat)
    printer.setOutputFileName(output_filename)
    printer.setPageMargins(0, 0, 0, 0, QPrinter.Inch)
    printer.setPageSize(QPageSize(
        QSizeF(float(world.shape[1] * cell_size + 2 * margin_size) / printer.resolution(),
               float(world.shape[0] * cell_size + 2 * margin_size) / printer.resolution()),
        QPageSize.Inch))

    painter = QPainter(printer)
    painter.translate(margin_size, margin_size)
    painter.setPen(QPen(colors['line'], 0))

    for y in range(world.shape[0] + 1):
        painter.drawLine(0,
                         cell_size * y,
                         cell_size * world.shape[1],
                         cell_size * y)

    for x in range(world.shape[1] + 1):
        painter.drawLine(cell_size * x,
                         0,
                         cell_size * x,
                         cell_size * world.shape[0])

    # Draw X marking starting location
    painter.drawLine(cell_size * agent_path[0][1],
                     cell_size * agent_path[0][0],
                     cell_size * (agent_path[0][1] + 1),
                     cell_size * (agent_path[0][0] + 1))

    painter.drawLine(cell_size * (agent_path[0][1] + 1),
                     cell_size * agent_path[0][0],
                     cell_size * agent_path[0][1],
                     cell_size * (agent_path[0][0] + 1))

    for row in range(world.shape[0]):
        for column in range(world.shape[1]):
            entity = world[row, column]
            if entity != FlatlandEntity.OPEN:
                painter.setBrush(QBrush(colors[entity]))
                painter.drawEllipse(
                    QPointF(cell_size * (column + 0.5),
                            cell_size * (row + 0.5)),
                    symbol_size * float(cell_size),
                    symbol_size * float(cell_size))

    pen_thickness_increment = 0.2
    pen_thickness           = 2.0

    for i, (first, second) in enumerate(zip(agent_path, agent_path[1:])):
        pen_thickness += pen_thickness_increment
        painter.setPen(QPen(colors['path'], pen_thickness, Qt.SolidLine, Qt.RoundCap))

        painter.drawLine(
            QPointF(cell_size * (first[1] + 0.5),
                    cell_size * (first[0] + 0.5)),
            QPointF(cell_size * (second[1] + 0.5),
                    cell_size * (second[0] + 0.5)))

    painter.end()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--agent', choices=['baseline', 'random', 'supervised', 'reinforcement'], required=True)
    parser.add_argument('--evaluate', type=int)
    parser.add_argument('--food_ratio', type=float, default=0.5)
    parser.add_argument('--max_steps', type=int, default=50)
    parser.add_argument('--pdf', metavar='output_filename', default='x.pdf')
    parser.add_argument('--poison_ratio', type=float, default=0.5)
    parser.add_argument('--sensor_range', type=int, default=1)
    parser.add_argument('--world_width', type=int, default=10)
    parser.add_argument('--world_height', type=int, default=10)
    args = parser.parse_args()

    world, agent_position, agent_heading = create_world(
        args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

    if args.agent == 'random':
        agent = RandomAgent()
    elif args.agent == 'baseline':
        agent = BaselineAgent()

    world, position_history, action_history, points = evaluate_agent(world, args.max_steps, args.sensor_range, agent, agent_position, agent_heading)

    if args.pdf:
        render(args.pdf, world, position_history)
        print(points)

    if args.evaluate:
        total_points = 0
        for _ in range(args.evaluate):
            world, agent_position, agent_heading = create_world(
                args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

            world, position_history, action_history, points = evaluate_agent(world, args.max_steps, args.sensor_range, agent, agent_position, agent_heading)

            total_points += points

        print(total_points / args.evaluate)

if __name__ == '__main__':
    main()
