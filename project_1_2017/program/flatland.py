#!/usr/bin/env python3

import argparse
import collections
import enum
import itertools
import numpy as np
import pickle
import random
import sys

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtSvg import *
from PyQt5.QtWidgets import *
from PyQt5.QtPrintSupport import *

class Action(enum.IntEnum):
    MOVE_LEFT    = 0
    MOVE_FORWARD = 1
    MOVE_RIGHT   = 2

class Direction(enum.IntEnum):
    LEFT    = 0
    FORWARD = 1
    RIGHT   = 2

class Entity(enum.IntEnum):
    EMPTY        = 0
    WALL         = 1
    FOOD         = 2
    POISON       = 3
    # These entities are mapped to EMPTY by masking two lower bits:
    FOOD_EATEN   = 4
    POISON_EATEN = 8

class Heading(enum.IntEnum):
    NORTH = 0
    EAST  = 1
    SOUTH = 2
    WEST  = 3

REWARDS = {
    Entity.EMPTY:           0,
    Entity.WALL:         -100,
    Entity.FOOD:            1,
    Entity.FOOD_EATEN:      0,
    Entity.POISON:         -4,
    Entity.POISON_EATEN:    0
}

class BaselineAgent(object):
    def __init__(self, args):
        self.baseline_go_sideways         = args.baseline_go_sideways
        self.baseline_prefer_avoid_wall   = args.baseline_prefer_avoid_wall
        self.baseline_prefer_right        = args.baseline_prefer_right
        self.baseline_take_food_near_wall = args.baseline_take_food_near_wall

    def act(self, percepts):
        ip = list(percepts[:,0])

        # L/F/R ambiguity:
        if ip[Direction.LEFT] == ip[Direction.FORWARD] and ip[Direction.FORWARD] == ip[Direction.RIGHT]:
            return (Action.MOVE_FORWARD if not self.baseline_go_sideways  else
                    Action.MOVE_RIGHT   if     self.baseline_prefer_right else
                    Action.MOVE_LEFT)

        # Single side wall ambiguity:
        if ip.count(Entity.WALL) == 1 and ip[Direction.FORWARD] == Entity.FOOD:
            if ip.count(Entity.FOOD) == 2:
                return (Action.MOVE_FORWARD if   self.baseline_take_food_near_wall else
                        Action.MOVE_LEFT    if   ip[Direction.RIGHT] == Entity.WALL
                                            else Action.MOVE_RIGHT)
            elif self.baseline_prefer_avoid_wall and ip.count(Entity.EMPTY) == 1:
                return Action.MOVE_LEFT if ip[Direction.RIGHT] == Entity.WALL else Action.MOVE_RIGHT
            else:
                return Action.MOVE_FORWARD

        # Single wall:
        if ip.count(Entity.WALL) == 1 and ip[Direction.FORWARD] != Entity.WALL:
            if ip.count(Entity.FOOD) == 2:
                return (Action.MOVE_FORWARD if   self.baseline_take_food_near_wall else
                        Action.MOVE_LEFT    if   ip[Direction.RIGHT] == Entity.WALL
                                            else Action.MOVE_RIGHT)
            elif ip.count(Entity.FOOD) == 1:
                if ip[Direction.FORWARD] == Entity.FOOD:
                    if self.baseline_prefer_avoid_wall and ip.count(Entity.EMPTY) == 1:
                        return Action.MOVE_LEFT if ip[Direction.RIGHT] == Entity.WALL else Action.MOVE_RIGHT
                    else:
                        return Action.MOVE_FORWARD
                else:
                    return Action.MOVE_LEFT if ip[Direction.RIGHT] == Entity.WALL else Action.MOVE_RIGHT
            elif ip.count(Entity.EMPTY) == 2:
                return Action.MOVE_LEFT if ip[Direction.RIGHT] == Entity.WALL else Action.MOVE_RIGHT
            elif ip.count(Entity.EMPTY) == 1:
                return (Action.MOVE_FORWARD if ip[Direction.FORWARD] == Entity.EMPTY else
                        Action.MOVE_LEFT    if ip[Direction.RIGHT]   == Entity.WALL  else
                        Action.MOVE_RIGHT)
            elif ip.count(Entity.POISON) == 2:
                return Action.MOVE_LEFT if ip[Direction.RIGHT] == Entity.WALL else Action.MOVE_RIGHT
            elif ip.count(Entity.POISON) == 1:
                return (Action.MOVE_FORWARD if ip[Direction.FORWARD] == Entity.POISON else
                        Action.MOVE_LEFT    if ip[Direction.RIGHT]   == Entity.WALL  else
                        Action.MOVE_RIGHT)

        # Prefer food:
        if ip.count(Entity.FOOD) == 1:
            return (Action.MOVE_LEFT    if ip[Direction.LEFT]    == Entity.FOOD else
                    Action.MOVE_FORWARD if ip[Direction.FORWARD] == Entity.FOOD else
                    Action.MOVE_RIGHT)
        elif ip.count(Entity.FOOD) == 2:
            if ip[Direction.FORWARD] != Entity.FOOD:
                # L/R ambiguity:
                return Action.MOVE_RIGHT if self.baseline_prefer_right else Action.MOVE_LEFT
            else:
                # S/F ambiguity:
                return (Action.MOVE_FORWARD if not self.baseline_go_sideways          else
                        Action.MOVE_RIGHT   if     ip[Direction.RIGHT] == Entity.FOOD else
                        Action.MOVE_LEFT)

        # Prefer empty:
        if ip.count(Entity.EMPTY) == 1:
            return (Action.MOVE_LEFT    if ip[Direction.LEFT]    == Entity.EMPTY else
                    Action.MOVE_FORWARD if ip[Direction.FORWARD] == Entity.EMPTY else
                    Action.MOVE_RIGHT)
        elif ip.count(Entity.EMPTY) == 2:
            if ip[Direction.FORWARD] != Entity.EMPTY:
                # L/R ambiguity:
                return Action.MOVE_RIGHT if self.baseline_prefer_right else Action.MOVE_LEFT
            else:
                # S/F ambiguity:
                return (Action.MOVE_FORWARD if not self.baseline_go_sideways           else
                        Action.MOVE_RIGHT   if     ip[Direction.RIGHT] == Entity.EMPTY else
                        Action.MOVE_LEFT)

        # Prefer poison:
        if ip.count(Entity.POISON) == 1:
            return (Action.MOVE_LEFT    if ip[Direction.LEFT]    == Entity.POISON else
                    Action.MOVE_FORWARD if ip[Direction.FORWARD] == Entity.POISON else
                    Action.MOVE_RIGHT)
        elif ip.count(Entity.POISON) == 2:
            if ip[Direction.FORWARD] != Entity.POISON:
                # L/R ambiguity:
                return Action.MOVE_RIGHT if self.baseline_prefer_right else Action.MOVE_LEFT
            else:
                return (Action.MOVE_FORWARD if not self.baseline_go_sideways            else
                        Action.MOVE_RIGHT   if     ip[Direction.RIGHT] == Entity.POISON else
                        Action.MOVE_LEFT)

        raise Exception('unknown scenario: {}'.format(ip))

class RandomAgent(object):
    def __init__(self, args):
        pass

    def act(self, percepts):
        return np.random.choice(list(Action))

class LearningAgent(object):
    def __init__(self, args):
        self.weights = np.random.randn(3, 3 * 4 * args.sensor_range) * 0.001

    def act(self, percepts):
        return np.argmax(self.evaluate(percepts)[1])

    def evaluate(self, percepts):
        inputs  = encode_percepts_as_one_hot(percepts)
        outputs = np.dot(self.weights, inputs)
        return inputs, outputs

    def update_weights(self, learning_rate, delta, inputs):
        self.weights += learning_rate * np.dot(delta.reshape((-1, 1)), inputs.reshape((1, -1)))

class ReinforcementAgent(LearningAgent):
    def __init__(self, args):
        super().__init__(args)

    def train(self, percepts, percepts_next, learning_rate, discount_factor, reward):
        inputs, outputs = self.evaluate(percepts)
        action          = np.argmax(outputs)
        q_current       = outputs[action]
        q_next          = np.amax(self.evaluate(percepts_next)[1])
        delta           = (encode_int_as_one_hot(action, 3) *
                          (reward + discount_factor * q_next - q_current))
        self.update_weights(learning_rate, delta, inputs)

class SupervisedAgent(LearningAgent):
    def __init__(self, args):
        super().__init__(args)

    def train(self, percepts, learning_rate, target_action):
        inputs, outputs = self.evaluate(percepts)
        outputs        -= np.max(outputs) # Shift values for numerical stability
        softmax         = np.exp(outputs) / np.sum(np.exp(outputs))
        correct_choice  = encode_int_as_one_hot(target_action, 3)
        delta           = correct_choice - softmax
        self.update_weights(learning_rate, delta, inputs)

def apply_action(world, agent_position, agent_heading, action):
    # Update agent heading
    if action == Action.MOVE_LEFT:
        agent_heading = (agent_heading + 4 - 1) % 4
    elif action == Action.MOVE_RIGHT:
        agent_heading = (agent_heading + 1) % 4

    # Update agent position
    if agent_heading == Heading.NORTH:
        agent_position = (agent_position[0] - 1, agent_position[1])
    elif agent_heading == Heading.EAST:
        agent_position = (agent_position[0], agent_position[1] + 1)
    elif agent_heading == Heading.SOUTH:
        agent_position = (agent_position[0] + 1, agent_position[1])
    elif agent_heading == Heading.WEST:
        agent_position = (agent_position[0], agent_position[1] - 1)

    agent_position = (np.clip(agent_position[0], 0, world.shape[0] - 1),
                      np.clip(agent_position[1], 0, world.shape[1] - 1))

    entity = world[agent_position]
    reward = REWARDS[entity]
    done   = entity == Entity.WALL

    if entity == Entity.FOOD:
        world[agent_position] = Entity.FOOD_EATEN
    elif entity == Entity.POISON:
        world[agent_position] = Entity.POISON_EATEN

    return reward, done, agent_position, agent_heading

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
    world = np.full((width + 2, height + 2), Entity.EMPTY, dtype=int)

    # Add wall border
    world[ 0, :] = Entity.WALL
    world[-1, :] = Entity.WALL
    world[ :, 0] = Entity.WALL
    world[ :,-1] = Entity.WALL

    world[np.where(np.logical_and(
        world == Entity.EMPTY,
        np.random.choice([True, False], world.shape, p=[food_ratio, 1.0 - food_ratio])))] \
             = Entity.FOOD

    world[np.where(np.logical_and(
        world == Entity.EMPTY,
        np.random.choice([True, False], world.shape, p=[poison_ratio, 1.0 - poison_ratio])))] \
            = Entity.POISON

    agent_position = list(zip(*np.where(world == Entity.EMPTY)))[0]
    agent_heading  = np.random.choice(list(Heading))

    return world, agent_position, agent_heading

def encode_int_as_one_hot(value, k):
    one_hot_encoding = np.zeros(k)
    one_hot_encoding[value] = 1
    return one_hot_encoding

def encode_percepts_as_one_hot(percepts):
    one_hot_percepts = np.zeros((3 * len(percepts[0]), 4))
    one_hot_percepts[np.arange(one_hot_percepts.shape[0]), np.concatenate(percepts)] = 1
    return one_hot_percepts.flatten()

def evaluate_agent(world, steps, sensor_range, agent, agent_position, agent_heading):
    world  = np.copy(world)
    done   = False
    points = 0

    position_history = [agent_position]
    percepts_history = []
    action_history   = []

    while not done and steps > 0:
        percepts = get_percepts(world, sensor_range, agent_position, agent_heading)
        action   = agent.act(percepts)

        reward, done, agent_position, agent_heading = apply_action(
            world, agent_position, agent_heading, action)

        percepts_history.append(np.copy(percepts))
        action_history.append(action)
        position_history.append(agent_position)

        points += reward
        steps  -= 1

    return world, position_history, percepts_history, action_history, points

def get_percepts(world, sensor_range, agent_position, agent_heading):
    # Construct perception
    padded_world = np.full(
        (world.shape[0] + 2 * sensor_range, world.shape[1] + 2 * sensor_range),
        Entity.WALL, dtype=int)

    padded_world[sensor_range:sensor_range + world.shape[0],
                 sensor_range:sensor_range + world.shape[1]] = world

    # Rotate perception according to agent heading and mask two lower bits
    # such that FOOD_EATEN and POISON_EATEN are mapped to EMPTY.
    agent_percepts = np.rot90(
        padded_world[agent_position[0]:agent_position[0] + 2 * sensor_range + 1,
                     agent_position[1]:agent_position[1] + 2 * sensor_range + 1],
        agent_heading) & 0x3

    # Get agent action
    percepts = np.stack((
        agent_percepts[sensor_range, sensor_range - 1::-1], # Left
        agent_percepts[sensor_range - 1::-1, sensor_range], # Forward
        agent_percepts[sensor_range, sensor_range + 1:]))   # Right

    return percepts

def render(output_filename, world, agent_path):
    app = QApplication([ '-platform', 'offscreen'])

    cell_size   = 50
    margin_size = 5
    symbol_size = 0.35

    colors = {
        'line':              QColor( 51,  51,  51),
        'path':              QColor( 51,  51,  51),
        Entity.WALL:         QColor( 88,  89,  91),
        Entity.FOOD:         QColor( 28, 150,  32),
        Entity.FOOD_EATEN:   QColor(135, 243, 132),
        Entity.POISON:       QColor(255, 153,   0),
        Entity.POISON_EATEN: QColor(204,  51, 102)
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
            if entity != Entity.EMPTY:
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
    parser.add_argument('--agent',
        choices=['baseline', 'random', 'supervised', 'reinforcement'])
    parser.add_argument('--baseline_go_sideways',         action='store_true')
    parser.add_argument('--baseline_prefer_avoid_wall',   action='store_true')
    parser.add_argument('--baseline_prefer_right',        action='store_true')
    parser.add_argument('--baseline_take_food_near_wall', action='store_true')
    parser.add_argument('--compare',                      action='store_true')
    parser.add_argument('--discount_factor',              type=float, default=0.9)
    parser.add_argument('--evaluate',                     type=int)
    parser.add_argument('--food_ratio',                   type=float, default=0.5)
    parser.add_argument('--learning_rate',                type=float, default=0.01)
    parser.add_argument('--load',                         type=str)
    parser.add_argument('--max_steps',                    type=int,   default=50)
    parser.add_argument('--poison_ratio',                 type=float, default=0.5)
    parser.add_argument('--render',                       action='store_true')
    parser.add_argument('--render_filename',              type=str,   default='flatland.pdf')
    parser.add_argument('--report_output',                action='store_true')
    parser.add_argument('--report_weights',               action='store_true')
    parser.add_argument('--save',                         type=str)
    parser.add_argument('--sensor_range',                 type=int,   default=1)
    parser.add_argument('--train',                        action='store_true')
    parser.add_argument('--training_round_repetitions',   type=int,   default=1)
    parser.add_argument('--training_round_size',          type=int,   default=100)
    parser.add_argument('--training_rounds',              type=int,   default=25)
    parser.add_argument('--world_height',                 type=int,   default=10)
    parser.add_argument('--world_width',                  type=int,   default=10)
    args = parser.parse_args()

    if args.load:
        agent = pickle.load(open(args.load, 'rb'))
    else:
        if not args.agent:
            print('Agent type must be specified')
            sys.exit(1)

        agent = globals()[args.agent.title() + 'Agent'](args)

    if args.train:
        if not issubclass(agent.__class__, LearningAgent):
            print('Agent class cannot be trained')
            sys.exit(1)

        if args.agent == 'supervised':
            baseline_agent = BaselineAgent(args)

        mean_agent_scores = np.zeros((args.training_round_repetitions, args.training_rounds))

        for training_round_repetition in range(args.training_round_repetitions):
            agent = globals()[args.agent.title() + 'Agent'](args)

            for training_round in range(args.training_rounds):
                total_points = 0

                for iteration in range(args.training_round_size):
                    world, agent_position, agent_heading = create_world(
                        args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

                    done   = False
                    steps  = args.max_steps
                    points = 0

                    while not done and steps > 0:
                        percepts = get_percepts(
                            world, args.sensor_range, agent_position, agent_heading)

                        action = agent.act(percepts)

                        reward, done, agent_position, agent_heading = apply_action(
                            world, agent_position, agent_heading, action)

                        if args.agent == 'supervised':
                            target_action = baseline_agent.act(percepts)
                            agent.train(percepts, args.learning_rate, target_action)
                        elif args.agent == 'reinforcement':
                            updated_percepts = get_percepts(
                                world, args.sensor_range, agent_position, agent_heading)

                            agent.train(percepts, updated_percepts,
                                args.learning_rate, args.discount_factor, reward)

                        points += reward
                        steps  -= 1

                    total_points += points

                mean_agent_scores[training_round_repetition, training_round] += \
                    total_points / args.training_round_size

        print('\n'.join('{} {} {}'.format(training_round + 1, mean, std)
            for training_round, mean, std in zip(
                range(args.training_rounds),
                np.mean(mean_agent_scores, axis=0),
                np.std(mean_agent_scores, axis=0))))

        if args.save:
            pickle.dump(agent, open(args.save, 'wb'))

    if args.evaluate:
        mean_agent_score = benchmark_agent(agent, args.evaluate, args)
        print(mean_agent_score)

    if args.report_output:
        for i, scenario in enumerate(itertools.product([Entity.EMPTY, Entity.WALL, Entity.FOOD, Entity.POISON], repeat=3)):
            percepts        = np.array(scenario).reshape(3, 1)
            inputs, outputs = agent.evaluate(percepts)
            action          = np.argmax(outputs)

            print(' & '.join(
                [str(i + 1)] +
                ['\\textsc{{{}}}'.format(str(Entity(entity))) for entity in scenario] +
                ['${:.5f}$'.format(float(output)) for output in outputs] +
                ['\\textsc{{{}}}'.format(str(Action(action))), '~ \\\\']))

    if args.report_weights:
        print('&{}\\\\'.format('&'.join(' \\textsc{{{}}} '.format(
            ''.join(x)) for x in itertools.product('LFR', 'EWFP'))))

        for i, action in enumerate(['Left', 'Forward', 'Right']):
            print('\\textsc{{{}}} &{}\\\\'.format(
                action, '&'.join(' \\textsc{{{:.5f}}} '.format(weight)
                    for weight in list(agent.weights[i, :]))))

    if args.compare:
        baseline_agent = BaselineAgent(args)

        for scenario in itertools.product([Entity.EMPTY, Entity.WALL, Entity.FOOD, Entity.POISON], repeat=3):
            percepts        = np.array(scenario).reshape(3, 1)
            action          = agent.act(percepts)
            baseline_action = baseline_agent.act(percepts)

            if action != baseline_action:
                print('{} -> Agent: {} Baseline: {}'.format(scenario, str(Action(action)), str(Action(baseline_action))))

    if args.render:
        world, agent_position, agent_heading = create_world(
            args.world_width, args.world_height, args.food_ratio, args.poison_ratio)

        world, position_history, percepts_history, action_history, points = evaluate_agent(
            world, args.max_steps, args.sensor_range, agent, agent_position, agent_heading)

        render(args.render_filename, world, position_history)

        print(points)

if __name__ == '__main__':
    main()
