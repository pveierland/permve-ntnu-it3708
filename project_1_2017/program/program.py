#!/usr/bin/env python3

import argparse
import collections
import enum
import itertools
import numpy as np
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

class FlatlandAction(enum.IntEnum):
    MOVE_FORWARD = 0
    MOVE_LEFT    = 1
    MOVE_RIGHT   = 2

class FlatlandHeading(enum.IntEnum):
    NORTH = 0
    EAST  = 1
    SOUTH = 2
    WEST  = 3

class FlatlandEntity(enum.IntEnum):
    OPEN         = 0
    OBSTACLE     = 1
    FOOD         = 2
    POISON       = 3
    # These entities are mapped to OPEN by masking two lower bits:
    FOOD_EATEN   = 4
    POISON_EATEN = 8

class BaselineAgent(object):
    def __init__(self, sensor_range):
        pass

    def act(self, percepts):
        immidiate_percepts = percepts[:,0]

        food = (immidiate_percepts == FlatlandEntity.FOOD)
        if np.any(food):
            return np.argmax(food)

        neutral = (immidiate_percepts == FlatlandEntity.OPEN)
        if np.any(neutral):
            return np.argmax(neutral)

        poison = (immidiate_percepts == FlatlandEntity.POISON)
        if np.any(poison):
            return np.argmax(poison)

        return FlatlandAction.MOVE_FORWARD

class RandomAgent(object):
    def __init__(self, sensor_range):
        pass

    def act(self, percepts):
        return np.random.choice(list(FlatlandAction))

class SupervisedLearningAgent(object):
    def __init__(self, sensor_range):
        self.weights = np.random.randn(3, 3 * 4 * sensor_range) * 0.001

    def act(self, percepts):
        return np.argmax(np.dot(self.weights, encode_percepts(percepts)))

    def evaluate(self, percepts):
        return np.dot(self.weights, encode_percepts(percepts))

    def train(self, percepts, target_action, learning_rate):
        one_hot_target = np.zeros(3)
        one_hot_target[target_action] = 1

        inputs  = encode_percepts(percepts)
        outputs = np.dot(self.weights, inputs)

        # Shift values for numerical stability
        outputs -= np.max(outputs)
        softmax  = np.exp(outputs) / np.sum(np.exp(outputs))

        delta = one_hot_target - softmax

        self.weights += learning_rate * np.dot(delta.reshape((3, 1)), inputs.reshape((1, 12)))

def benchmark_agent(agent, iterations, args):
    total_points = 0

    for _ in range(iterations):
        world, agent_position, agent_heading = create_world(
            args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

        _, _, _, _, points = evaluate_agent(
            world, args.max_steps, args.sensor_range, agent, agent_position, agent_heading)

        total_points += points

    return total_points / iterations

def create_world(width, height, food_ratio, poison_ratio):
    world = np.full((width + 2, height + 2), FlatlandEntity.OPEN, dtype=int)

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

def encode_percepts(percepts):
    one_hot_percepts = np.zeros((3 * len(percepts[0]), 4))
    one_hot_percepts[np.arange(one_hot_percepts.shape[0]), np.concatenate(percepts)] = 1
    return one_hot_percepts.flatten()

def evaluate_agent(world, steps, sensor_range, agent, agent_position, agent_heading):
    world = np.copy(world)

    rewards = {
        FlatlandEntity.OPEN:            0,
        FlatlandEntity.OBSTACLE:     -100,
        FlatlandEntity.FOOD:            1,
        FlatlandEntity.FOOD_EATEN:      0,
        FlatlandEntity.POISON:         -4,
        FlatlandEntity.POISON_EATEN:    0
    }

    padded_world = np.zeros(
        (world.shape[0] + 2 * sensor_range, world.shape[1] + 2 * sensor_range), dtype=int)

    points           = 0
    position_history = [agent_position]
    percept_history  = []
    action_history   = []

    while steps > 0:
        # Construct perception
        padded_world[sensor_range:sensor_range + world.shape[0],
                     sensor_range:sensor_range + world.shape[1]] = world

        # Rotate perception according to agent heading and mask two lower bits
        # such that FOOD_EATEN and POISON_EATEN are mapped to OPEN.
        agent_perception = np.rot90(
            padded_world[agent_position[0]:agent_position[0] + 2 * sensor_range + 1,
                         agent_position[1]:agent_position[1] + 2 * sensor_range + 1],
            agent_heading) & 0x3

        # Get agent action
        percepts = np.stack((
            agent_perception[sensor_range - 1::-1, sensor_range], # Forward
            agent_perception[sensor_range, sensor_range - 1::-1], # Left
            agent_perception[sensor_range, sensor_range + 1:]))   # Right

        percept_history.append(np.copy(percepts))
        action = agent.act(percepts)
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

    return world, position_history, percept_history, action_history, points

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
    parser.add_argument('--learning_rate', type=float, default=0.01)
    parser.add_argument('--training_rounds', type=int, default=1)
    parser.add_argument('--training_round_size', type=int, default=100)
    parser.add_argument('--training_round_evaluations', type=int, default=1000)
    args = parser.parse_args()

    if args.agent == 'random':
        agent = RandomAgent(args.sensor_range)
    elif args.agent == 'baseline':
        agent = BaselineAgent(args.sensor_range)
    elif args.agent == 'supervised':
        agent          = SupervisedLearningAgent(args.sensor_range)
        baseline_agent = BaselineAgent(args.sensor_range)

        for training_round in range(args.training_rounds):
            # Decay learning rate
            #learning_rate = (1.0 - training_round / (args.training_rounds - 1)) * args.learning_rate
            #print(learning_rate)

            for iteration in range(args.training_round_size):
                world, agent_position, agent_heading = create_world(
                    args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

                world, position_history, percept_history, action_history, points = evaluate_agent(
                    world, args.max_steps, args.sensor_range, baseline_agent, agent_position, agent_heading)

                # Shuffle training examples
                shuffled_indexes = np.random.permutation(len(percept_history))
                percept_history  = np.array(percept_history)[shuffled_indexes]
                action_history   = np.array(action_history)[shuffled_indexes]

                for percept, action in zip(percept_history, action_history):
                    agent.train(percept, action, args.learning_rate)

            mean_agent_score = benchmark_agent(
                agent, args.training_round_evaluations, args)

            print('Completed training round {}/{}. Mean score: {}'.format(
                training_round + 1, args.training_rounds, mean_agent_score))

    if args.evaluate:
        mean_agent_score = benchmark_agent(
            agent, args.evaluate, args)

        print('Mean {} score across {} trials: {}'.format(
            agent.__class__.__name__, args.evaluate, mean_agent_score))

    if args.pdf:
        world, agent_position, agent_heading = create_world(
            args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

        world, position_history, percept_history, action_history, points = evaluate_agent(
            world, args.max_steps, args.sensor_range, agent, agent_position, agent_heading)

        render(args.pdf, world, position_history)

if __name__ == '__main__':
    main()
