#!/usr/bin/python3

import array
import colour
import collections
import enum
import itertools
import math
import numpy
import os
import random
import sys
import threading
import time
import timeit

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *

ENTITY_RADIUS     = 0
ENTITY_POSITION_X = 1
ENTITY_POSITION_Y = 2

BOID_ATTRIBUTES   = 17
BOID_POSITION_X   = 1
BOID_POSITION_Y   = 2
BOID_VELOCITY_X   = 3
BOID_VELOCITY_Y   = 4
BOID_COHESION_X   = 5
BOID_COHESION_Y   = 6
BOID_ALIGNMENT_X  = 7
BOID_ALIGNMENT_Y  = 8
BOID_SEPARATION_X = 9
BOID_SEPARATION_Y = 10
BOID_PREDATOR_X   = 11
BOID_PREDATOR_Y   = 12
BOID_OBSTACLE_X   = 13
BOID_OBSTACLE_Y   = 14
BOID_OBSTACLES    = 15
BOID_NEIGHBORS    = 16

OBSTACLE_ATTRIBUTES = 3

class BoidSimulation(object):

    class Parameter(enum.Enum):
        prey                  = (1, 0, 200, 0)
        predators             = (2, 0, 100, 0)
        obstacles             = (3, 0, 50, 0)
        separation            = (4, 0.0, 100.0, 11.0)
        alignment             = (5, 0.0, 2.0, 0.18)
        cohesion              = (6, 0.0, 2.0, 0.22)
        predator_weight       = (7, 0.0, 10.0, 2.0)
        neighbor_range        = (8, 1.0, 200.0, 80.0)
        separation_range      = (9, 1.0, 100.0, 25.0)
        predator_range        = (10, 1.0, 100.0, 75.0)
        prey_velocity_limit     = (11, 0.1, 10.0, 5.0)
        predator_velocity_limit = (12, 0.1, 10.0, 4.0)
        predator_chase_weight = (13, 0.0, 10.0, 0.05)
        prey_obstacle_weight  = (14, 0.0, 10.0, 8.0)
        obstacle_test_range   = (15, 0.0, 100.0, 50.0)

        def __init__(self, identity, min_value, max_value, default_value):
            self.identity      = identity
            self.min_value     = min_value
            self.max_value     = max_value
            self.default_value = default_value

    def __init__(self):
        self.world_size     = (1.0, 1.0)
        self.prey_boids     = collections.deque(maxlen=500)
        self.obstacles      = collections.deque()
        self.predator_boids = collections.deque()

        self.parameters = {}
        for parameter in BoidSimulation.Parameter:
            self.set_parameter_value(parameter, parameter.default_value)

    def __add_obstacle(self, x, y, radius):
        obstacle = array.array('f', (0.0,) * OBSTACLE_ATTRIBUTES)
        obstacle[ENTITY_RADIUS]     = radius
        obstacle[ENTITY_POSITION_X] = x
        obstacle[ENTITY_POSITION_Y] = y
        self.obstacles.append(obstacle)

    def __build_random_boid(self, velocity_magnitude, radius):
        random_position = self.world_size * numpy.random.rand(2)

        velocity_direction = random.uniform(-math.pi, math.pi)

        random_velocity = numpy.array([
            math.cos(velocity_direction) * velocity_magnitude,
            math.sin(velocity_direction) * velocity_magnitude])

        boid                  = array.array('f', (0.0,) * BOID_ATTRIBUTES)
        boid[ENTITY_RADIUS]     = radius
        boid[BOID_POSITION_X] = random.random() * self.world_size[0]
        boid[BOID_POSITION_Y] = random.random() * self.world_size[1]
        boid[BOID_VELOCITY_X] = math.cos(velocity_direction) * velocity_magnitude
        boid[BOID_VELOCITY_Y] = math.sin(velocity_direction) * velocity_magnitude

        return boid

    def __update_prey_cells(self):
        neighbor_range = self.get_parameter_value(BoidSimulation.Parameter.neighbor_range)

        num_prey_cells = (int(math.ceil(self.world_size[0] / neighbor_range)),
                          int(math.ceil(self.world_size[1] / neighbor_range)))

        self.prey_cells = numpy.empty(num_prey_cells, dtype=object)

        for x in range(num_prey_cells[0]):
            for y in range(num_prey_cells[1]):
                self.prey_cells[x, y] = collections.deque(maxlen=500)

    def get_parameter_value(self, parameter):
        return self.parameters[parameter]

    def set_parameter_value(self, parameter, value):
        self.parameters[parameter] = value

        if parameter is BoidSimulation.Parameter.neighbor_range:
            self.__update_prey_cells()
        elif parameter is BoidSimulation.Parameter.prey:
            if value > len(self.prey_boids):
                for _ in range(value - len(self.prey_boids)):
                    self.spawn_random_prey()
            elif value < len(self.prey_boids):
                for _ in range(len(self.prey_boids) - value):
                    self.prey_boids.pop()
        elif parameter is BoidSimulation.Parameter.predators:
            if value > len(self.predator_boids):
                for _ in range(value - len(self.predator_boids)):
                    self.spawn_random_predator()
            elif value < len(self.predator_boids):
                for _ in range(len(self.predator_boids) - value):
                    self.predator_boids.pop()
        elif parameter is BoidSimulation.Parameter.obstacles:
            if value > len(self.obstacles):
                for _ in range(value - len(self.obstacles)):
                    self.spawn_random_obstacle()
            elif value < len(self.obstacles):
                for _ in range(len(self.obstacles) - value):
                    self.obstacles.pop()

    def set_world_size(self, width, height):
        self.world_size = (width, height)
        self.__update_prey_cells()

    def spawn_random_predator(self):
        self.predator_boids.append(self.__build_random_boid(
            self.get_parameter_value(BoidSimulation.Parameter.predator_velocity_limit), 20.0))

    def spawn_random_prey(self):
        self.prey_boids.append(self.__build_random_boid(
            self.get_parameter_value(BoidSimulation.Parameter.prey_velocity_limit), 12.0))

    def spawn_random_obstacle(self):
        self.__add_obstacle(
            radius=random.uniform(5.0, 25.0),
            x=random.random() * self.world_size[0],
            y=random.random() * self.world_size[1])

    def step(self):
        def calculate_obstacle_force(obstacle, boid):
            velocity_magnitude = math.hypot(boid[BOID_VELOCITY_X], boid[BOID_VELOCITY_Y])

            forward_x = boid[BOID_VELOCITY_X] / velocity_magnitude
            forward_y = boid[BOID_VELOCITY_Y] / velocity_magnitude

            diff_x = obstacle[ENTITY_POSITION_X] - boid[BOID_POSITION_X]
            diff_y = obstacle[ENTITY_POSITION_Y] - boid[BOID_POSITION_Y]

            projection_magnitude = diff_x * forward_x + diff_y * forward_y

            if projection_magnitude > 0.0 and projection_magnitude < obstacle_test_range:
                # Obstacle is in front of boid
                projection_x = forward_x * projection_magnitude
                projection_y = forward_y * projection_magnitude

                dist_x = projection_x - diff_x
                dist_y = projection_y - diff_y

                dist_magnitude = math.hypot(dist_x, dist_y)

                if dist_magnitude < obstacle[ENTITY_RADIUS] + boid[ENTITY_RADIUS]:
                    forward_direction = math.atan2(forward_y, forward_x)

                    is_diff_left_of_velocity = \
                        1.0 if (-diff_y * boid[BOID_VELOCITY_X] + diff_x * boid[BOID_VELOCITY_Y]) >= 0.0 else -1.0

                    forward_direction += is_diff_left_of_velocity * math.pi / 2.0

                    ratio = projection_magnitude / obstacle_test_range

                    force_x = math.cos(forward_direction) * velocity_limit * (1.0 - ratio) * ratio
                    force_y = math.sin(forward_direction) * velocity_limit * (1.0 - ratio) * ratio

                    boid[BOID_OBSTACLE_X] += force_x
                    boid[BOID_OBSTACLE_Y] += force_y
                    boid[BOID_OBSTACLES] += 1

        #time_a = timeit.default_timer()

        neighbor_range    = self.get_parameter_value(BoidSimulation.Parameter.neighbor_range)
        separation_range  = self.get_parameter_value(BoidSimulation.Parameter.separation_range)
        cohesion_weight   = self.get_parameter_value(BoidSimulation.Parameter.cohesion)
        alignment_weight  = self.get_parameter_value(BoidSimulation.Parameter.alignment)
        separation_weight = self.get_parameter_value(BoidSimulation.Parameter.separation)
        predator_weight   = self.get_parameter_value(BoidSimulation.Parameter.predator_weight)
        velocity_limit    = self.get_parameter_value(BoidSimulation.Parameter.prey_velocity_limit)
        predator_range    = self.get_parameter_value(BoidSimulation.Parameter.predator_range)
        predator_chase_weight = self.get_parameter_value(BoidSimulation.Parameter.predator_chase_weight)
        predator_velocity_limit = self.get_parameter_value(BoidSimulation.Parameter.predator_velocity_limit)
        prey_obstacle_weight = self.get_parameter_value(BoidSimulation.Parameter.prey_obstacle_weight)
        obstacle_test_range = self.get_parameter_value(BoidSimulation.Parameter.obstacle_test_range)

        half_range = neighbor_range / 2.0

        for boid in self.prey_boids:
            offsets = (int(boid[BOID_POSITION_X] // neighbor_range),
                       int(boid[BOID_POSITION_Y] // neighbor_range))
            self.prey_cells[offsets[0], offsets[1]].append(boid)

            for i in range(5, BOID_ATTRIBUTES):
                boid[i] = 0.0

        for predator in self.predator_boids:
            for i in range(5, BOID_ATTRIBUTES):
                predator[i] = 0.0

        #time_b = timeit.default_timer()

        for obstacle in self.obstacles:
            offset_x, remainder_x = divmod(obstacle[ENTITY_POSITION_X], neighbor_range)
            offset_y, remainder_y = divmod(obstacle[ENTITY_POSITION_Y], neighbor_range)

            offset_x = int(offset_x)
            offset_y = int(offset_y)

            start_x = max(0, offset_x - int(math.ceil(max(0.0, (obstacle[ENTITY_RADIUS] + 12.0) - remainder_x) / neighbor_range)))
            end_x   = min(self.prey_cells.shape[0], offset_x + 1 + int(math.ceil(max(0.0, predator_range - (neighbor_range - remainder_x)) / neighbor_range)))

            start_y = max(0, offset_y - int(math.ceil(max(0.0, (obstacle[ENTITY_RADIUS] + 12.0) - remainder_y) / neighbor_range)))
            end_y   = min(self.prey_cells.shape[1], offset_y + 1 + int(math.ceil(max(0.0, predator_range - (neighbor_range - remainder_y)) / neighbor_range)))

            for predator in self.predator_boids:
                calculate_obstacle_force(obstacle, predator)

            for x in range(start_x, end_x):
                for y in range(start_y, end_y):
                    for prey in self.prey_cells[x, y]:
                        calculate_obstacle_force(obstacle, prey)

        for predator in self.predator_boids:
            offset_x, remainder_x = divmod(predator[BOID_POSITION_X], neighbor_range)
            offset_y, remainder_y = divmod(predator[BOID_POSITION_Y], neighbor_range)

            offset_x = int(offset_x)
            offset_y = int(offset_y)

            start_x = max(0, offset_x - int(math.ceil(max(0.0, predator_range - remainder_x) / neighbor_range)))
            end_x   = min(self.prey_cells.shape[0], offset_x + 1 + int(math.ceil(max(0.0, predator_range - (neighbor_range - remainder_x)) / neighbor_range)))

            start_y = max(0, offset_y - int(math.ceil(max(0.0, predator_range - remainder_y) / neighbor_range)))
            end_y   = min(self.prey_cells.shape[1], offset_y + 1 + int(math.ceil(max(0.0, predator_range - (neighbor_range - remainder_y)) / neighbor_range)))

            for x in range(start_x, end_x):
                for y in range(start_y, end_y):
                    for prey in self.prey_cells[x, y]:
                        position_delta_x = prey[BOID_POSITION_X] - predator[BOID_POSITION_X]
                        position_delta_y = prey[BOID_POSITION_Y] - predator[BOID_POSITION_Y]

                        if abs(position_delta_x) > predator_range or \
                           abs(position_delta_y) > predator_range:
                            continue

                        position_delta_magnitude = math.hypot(position_delta_y, position_delta_x)

                        if position_delta_magnitude == 0.0 or position_delta_magnitude > predator_range:
                            continue

                        prey[BOID_PREDATOR_X] += position_delta_x / position_delta_magnitude
                        prey[BOID_PREDATOR_Y] += position_delta_y / position_delta_magnitude

                        predator[BOID_COHESION_X] += prey[BOID_POSITION_X]
                        predator[BOID_COHESION_Y] += prey[BOID_POSITION_Y]
                        predator[BOID_NEIGHBORS] += 1

            num_neighbors = predator[BOID_NEIGHBORS]

            velocity_x = predator[BOID_VELOCITY_X]
            velocity_y = predator[BOID_VELOCITY_Y]

            if num_neighbors:
                cohesion_force_x = predator[BOID_COHESION_X] / num_neighbors - predator[BOID_POSITION_X]
                cohesion_force_y = predator[BOID_COHESION_Y] / num_neighbors - predator[BOID_POSITION_Y]

                velocity_x += predator_chase_weight * cohesion_force_x
                velocity_y += predator_chase_weight * cohesion_force_y

                velocity_magnitude = math.hypot(velocity_x, velocity_y)

                if velocity_magnitude > predator_velocity_limit:
                    velocity_x = velocity_x / velocity_magnitude * predator_velocity_limit
                    velocity_y = velocity_y / velocity_magnitude * predator_velocity_limit

            if predator[BOID_OBSTACLES]:
                velocity_x += predator[BOID_OBSTACLE_X]
                velocity_y += predator[BOID_OBSTACLE_Y]

            predator[BOID_VELOCITY_X] = velocity_x
            predator[BOID_VELOCITY_Y] = velocity_y

            predator[BOID_POSITION_X] = (predator[BOID_POSITION_X] + predator[BOID_VELOCITY_X]) % self.world_size[0]
            predator[BOID_POSITION_Y] = (predator[BOID_POSITION_Y] + predator[BOID_VELOCITY_Y]) % self.world_size[1]

        for boid in self.prey_boids:
            offset_x, remainder_x = divmod(boid[BOID_POSITION_X], neighbor_range)
            offset_y, remainder_y = divmod(boid[BOID_POSITION_Y], neighbor_range)

            offset_x = int(offset_x)
            offset_y = int(offset_y)

            ox = offset_x - 1 if remainder_x < half_range else offset_x
            oy = offset_y - 1 if remainder_y < half_range else offset_y

            for x in range(max(ox, 0), min(ox + 2, self.prey_cells.shape[0])):
                for y in range(max(oy, 0), min(oy + 2, self.prey_cells.shape[1])):
                    for other in self.prey_cells[x, y]:
                        if boid is other:
                            continue

                        position_delta_x = boid[BOID_POSITION_X] - other[BOID_POSITION_X]
                        position_delta_y = boid[BOID_POSITION_Y] - other[BOID_POSITION_Y]

                        if abs(position_delta_x) > neighbor_range or \
                           abs(position_delta_y) > neighbor_range:
                            continue

                        position_delta_magnitude = math.hypot(position_delta_y, position_delta_x)

                        if position_delta_magnitude == 0.0 or position_delta_magnitude > neighbor_range:
                            continue

                        boid[BOID_COHESION_X] += other[BOID_POSITION_X]
                        boid[BOID_COHESION_Y] += other[BOID_POSITION_Y]

                        other[BOID_COHESION_X] += boid[BOID_POSITION_X]
                        other[BOID_COHESION_Y] += boid[BOID_POSITION_Y]

                        boid[BOID_ALIGNMENT_X] += other[BOID_VELOCITY_X]
                        boid[BOID_ALIGNMENT_Y] += other[BOID_VELOCITY_Y]

                        other[BOID_ALIGNMENT_X] += boid[BOID_VELOCITY_X]
                        other[BOID_ALIGNMENT_Y] += boid[BOID_VELOCITY_Y]

                        scaled_separation_x = position_delta_x / position_delta_magnitude
                        scaled_separation_y = position_delta_y / position_delta_magnitude

                        boid[BOID_SEPARATION_X] += scaled_separation_x
                        boid[BOID_SEPARATION_Y] += scaled_separation_y

                        other[BOID_SEPARATION_X] += -scaled_separation_x
                        other[BOID_SEPARATION_Y] += -scaled_separation_y

                        boid[BOID_NEIGHBORS] += 1
                        other[BOID_NEIGHBORS] += 1

            self.prey_cells[offset_x, offset_y].remove(boid)

        for boid in self.prey_boids:
            num_neighbors = boid[BOID_NEIGHBORS]

            velocity_x = boid[BOID_VELOCITY_X]
            velocity_y = boid[BOID_VELOCITY_Y]

            if num_neighbors:
                cohesion_force_x = boid[BOID_COHESION_X] / num_neighbors - boid[BOID_POSITION_X]
                cohesion_force_y = boid[BOID_COHESION_Y] / num_neighbors - boid[BOID_POSITION_Y]

                alignment_force_x = boid[BOID_ALIGNMENT_X] / num_neighbors
                alignment_force_y = boid[BOID_ALIGNMENT_Y] / num_neighbors

                separation_force_x = boid[BOID_SEPARATION_X] / num_neighbors
                separation_force_y = boid[BOID_SEPARATION_Y] / num_neighbors

                velocity_x += cohesion_weight * cohesion_force_x \
                    + alignment_weight * alignment_force_x \
                    + separation_weight * separation_force_x \
                    + predator_weight * boid[BOID_PREDATOR_X]

                velocity_y += cohesion_weight * cohesion_force_y \
                    + alignment_weight * alignment_force_y \
                    + separation_weight * separation_force_y \
                    + predator_weight * boid[BOID_PREDATOR_Y]

            if boid[BOID_OBSTACLES]:
                obstacle_force_x = boid[BOID_OBSTACLE_X] / boid[BOID_OBSTACLES]
                obstacle_force_y = boid[BOID_OBSTACLE_Y] / boid[BOID_OBSTACLES]
                velocity_x += prey_obstacle_weight * obstacle_force_x
                velocity_y += prey_obstacle_weight * obstacle_force_y

            velocity_magnitude = math.hypot(velocity_x, velocity_y)

            if velocity_magnitude > velocity_limit:
                velocity_x = velocity_x / velocity_magnitude * velocity_limit
                velocity_y = velocity_y / velocity_magnitude * velocity_limit

            boid[BOID_VELOCITY_X] = velocity_x
            boid[BOID_VELOCITY_Y] = velocity_y

            boid[BOID_POSITION_X] = (boid[BOID_POSITION_X] + boid[BOID_VELOCITY_X]) % self.world_size[0]
            boid[BOID_POSITION_Y] = (boid[BOID_POSITION_Y] + boid[BOID_VELOCITY_Y]) % self.world_size[1]

class BoidSimulationWidget(QWidget):

    class Action(enum.Enum):
        add_prey      = 1
        add_predator  = 2
        add_obstacle  = 3
        delete_object = 4

    colors = {
        'background':          QColor(255, 255, 255),
        'obstacle_background': QColor(247, 212, 23),
        'obstacle_foreground': QColor(31, 26, 23),
        'predator':            QColor(215, 53, 38),
        'prey':                QColor(114, 191, 68)
    }

    fps_updated              = pyqtSignal(float)
    play_state_changed       = pyqtSignal(bool)
    simulation_state_changed = pyqtSignal(str)

    def __init__(self, parent, boid_simulation):
        super(BoidSimulationWidget, self).__init__(parent)

        self.boid_simulation = boid_simulation

        self.setSizePolicy(QSizePolicy(
            QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding))

        self.drawing_lock      = threading.Lock()
        self.left_click_action = BoidSimulationWidget.Action.add_prey
        self.frequency         = 1
        self.play_thread       = None
        self.is_playing        = False

        self.__initialize_paints()

        self.frame_timings      = collections.deque(maxlen=10)
        self.fps_update_counter = 0

        self.__post_simulation_state()

    def __calculate_prey_neighbors(self, prey):
        return [other for other in self.prey_boids
                if other is not prey and
                math.hypot(other.position[1] - prey.position[1], other.position[0] - prey.position[0])
                    <= self.get_parameter_value(BoidSimulation.Parameter.neighbor_range)]

    def __get_prey_brush(self, prey):
        neighbor_count = prey[BOID_NEIGHBORS]
        return self.prey_brushes[min(int(neighbor_count), len(self.prey_brushes) - 1)]

    def __initialize_paints(self):
        def build_obstacle_brush():
            obstacle_pixmap = QPixmap(50, 50)
            painter = QPainter(obstacle_pixmap)
            painter.setRenderHint(QPainter.Antialiasing, True)
            painter.fillRect(0.0, 0.0, 50.0, 50.0,
                             QBrush(BoidSimulationWidget.colors['obstacle_background']))
            painter.setPen(QPen(QBrush(BoidSimulationWidget.colors['obstacle_foreground']), 9.0))

            x = -55.0
            while x <= 105.0:
                painter.drawLine(x, 55.0, x + 60.0, -5.0)
                x += ((105.0 - 5.0) / 4.0)

            painter.end()

            return QBrush(Qt.black, obstacle_pixmap)

        self.boid_pen     = QPen(QBrush(Qt.black), 2.0)
        self.border_pen   = QPen(QBrush(Qt.black), 0)
        self.obstacle_pen = QPen(QBrush(QColor(31, 26, 23)), 2.0)

        self.background_brush = QBrush(BoidSimulationWidget.colors['background'])
        self.obstacle_brush   = build_obstacle_brush()
        self.predator_brush   = QBrush(BoidSimulationWidget.colors['predator'])

        prey_color_dark   = colour.Color('#128246')
        prey_color_light  = colour.Color('#92C0E2')
        prey_colors       = prey_color_light.range_to(prey_color_dark, 10)
        self.prey_brushes = [QBrush(QColor(color.red * 255, color.green * 255, color.blue * 255))
                             for color in prey_colors]

        self.boid_path = QPainterPath()
        self.boid_path.moveTo( 0.0, -1.0)
        self.boid_path.lineTo(-0.5,  1.0)
        self.boid_path.lineTo( 0.5,  1.0)
        self.boid_path.lineTo( 0.0, -1.0)

    def __post_simulation_state(self):
        num_prey      = len(self.boid_simulation.prey_boids)
        num_predators = len(self.boid_simulation.predator_boids)
        num_obstacles = len(self.boid_simulation.obstacles)

        self.simulation_state_changed.emit(
            'Boids: {1}{0}Prey: {2}{0}Predators: {3}{0}Obstacles: {4}'.format(
                ' ' * 4,
                num_prey + num_predators,
                num_prey,
                num_predators,
                0))

    def __update_fps(self):
        time_b = time.time()

        if self.fps_update_counter == 10:
            num_frames = len(self.frame_timings) + 1
            time_a     = self.frame_timings.popleft()
            fps        = num_frames / (time_b - time_a)

            self.fps_updated.emit(fps)
            self.fps_update_counter = 0

        self.frame_timings.append(time_b)
        self.fps_update_counter += 1

    def get_left_click_action(self):
        return self.left_click_action

    def get_parameter_value(self, parameter):
        with self.drawing_lock:
            return self.boid_simulation.parameters[parameter]

#    def mouseMoveEvent(self, event):
#        if self.focus_boid:
#            new_velocity = numpy.array([float(event.x()), float(event.y())]) - self.focus_boid.position
#            new_velocity_magnitude = numpy.linalg.norm(new_velocity)
#
#            if new_velocity_magnitude and new_velocity_magnitude > self.get_parameter_value(BoidSimulation.Parameter.max_velocity):
#                new_velocity = new_velocity / new_velocity_magnitude * self.get_parameter_value(BoidSimulation.Parameter.max_velocity)
#
#            self.focus_boid.velocity = new_velocity
#            self.update()
#
#    def mousePressEvent(self, event):
#        if self.left_click_action is BoidSimulationWidget.Action.add_prey:
#            boid = Prey(numpy.array([float(event.x()), float(event.y())]))
#        elif self.left_click_action is BoidSimulationWidget.Action.add_predator:
#            boid = Predator(numpy.array([float(event.x()), float(event.y())]))
#
#        if boid:
#            self.boids.append(boid)
#            self.focus_boid = boid
#
#        self.update()

#    def mousePressEvent(self, event):
#        if self.left_click_action is BoidSimulationWidget.Action.add_obstacle:
#            entity = 
#
#
#        add_obstacle  = 3

    def mouseReleaseEvent(self, event):
        #self.focus_boid = None

        with self.drawing_lock:
            self.boid_simulation.spawn_random_prey()
            self.__post_simulation_state()

        #for _ in range(100):
        #self.boid_simulation.spawn_random_prey()

        #boid = array.array('f', (0.0,) * 12)
        #boid[ENTITY_RADIUS]     = 10.0
        #boid[BOID_POSITION_X] = float(event.x())
        #boid[BOID_POSITION_Y] = float(event.y())
        #boid[BOID_VELOCITY_X] = 2.5
        #boid[BOID_VELOCITY_Y] = 0.0

        #with self.drawing_lock:
        #    self.boid_simulation.prey_boids.append(boid)

#        for _ in range(1000):
#            self.step()

        self.update()

    def paintEvent(self, event):
        def paint_boid(painter, boid, brush):
            boid_radius    = boid[ENTITY_RADIUS]
            boid_direction = math.atan2(boid[BOID_VELOCITY_Y], boid[BOID_VELOCITY_X])

            painter.save()
            painter.translate(boid[BOID_POSITION_X], boid[BOID_POSITION_Y])
            painter.rotate(90.0 + 180.0 * boid_direction / math.pi)
            painter.scale(boid_radius, boid_radius)
            painter.fillPath(self.boid_path, brush)
            painter.restore()

        time_a = timeit.default_timer()

        with self.drawing_lock:
            painter = QPainter(self)
            painter.setRenderHint(QPainter.Antialiasing, True)

            # Draw background with border
            painter.fillRect(event.rect(), self.background_brush)
            painter.setPen(self.border_pen)
            painter.drawRect(event.rect())

            # Draw obstacles
            painter.setPen(self.obstacle_pen)

            for obstacle in self.boid_simulation.obstacles:
                painter.drawEllipse(
                    QPointF(obstacle[ENTITY_POSITION_X], obstacle[ENTITY_POSITION_Y]),
                    obstacle[ENTITY_RADIUS], obstacle[ENTITY_RADIUS])
                painter.setBrush(self.obstacle_brush)
                painter.drawEllipse(
                    QPointF(obstacle[ENTITY_POSITION_X], obstacle[ENTITY_POSITION_Y]),
                    obstacle[ENTITY_RADIUS], obstacle[ENTITY_RADIUS])

            for prey in self.boid_simulation.prey_boids:
                paint_boid(painter, prey, self.__get_prey_brush(prey))

            for predator in self.boid_simulation.predator_boids:
                paint_boid(painter, predator, self.predator_brush)

    def play(self):
        while self.is_playing:
            #now = time.time()
            #t = 1.0 / self.frequency
            #time.sleep(t - (now - self.thread_start) % t)
            time.sleep(1.0 / self.frequency)

            with self.drawing_lock:
                self.step()

            self.__update_fps()

    def resizeEvent(self, event):
        with self.drawing_lock:
            self.boid_simulation.set_world_size(
                float(event.size().width()),
                float(event.size().height()))

    def set_frequency(self, frequency):
        self.frequency = frequency

    def set_left_click_action(self, action):
        self.left_click_action = action

    def set_parameter_value(self, parameter, value):
        with self.drawing_lock:
            self.boid_simulation.set_parameter_value(parameter, value)
        self.update()
        self.__post_simulation_state()

    def set_playing(self, is_playing):
        self.is_playing = is_playing
        self.play_state_changed.emit(is_playing)

    def sizeHint(self):
        return QSize(500, 500)

    def step(self):
        self.boid_simulation.step()
        self.update()

    def stop(self):
        self.set_playing(False)
        if self.play_thread:
            self.play_thread.join()

    def toggle_play(self):
        if not self.is_playing:
            self.set_playing(True)
            self.thread_start = time.time()
            self.play_thread  = threading.Thread(target=self.play)
            self.play_thread.start()
        else:
            self.set_playing(False)

class BoidApplication(QMainWindow):
    def __init__(self):
        super(BoidApplication, self).__init__()

        self.label_simulation_state = QLabel()
        self.label_fps              = QLabel()

        self.boid_simulation = BoidSimulation()
        self.boid_simulation_widget = BoidSimulationWidget(
            self,
            self.boid_simulation)

        self.boid_simulation_widget.fps_updated.connect(self.update_fps_value)
        self.boid_simulation_widget.play_state_changed.connect(self.update_play_state)
        self.boid_simulation_widget.simulation_state_changed.connect(self.update_simulation_state)

        self.initialize_group_box_parameters()
        self.initialize_group_box_control()
        self.initialize_group_box_action()

        label_layout = QHBoxLayout()
        label_layout.addWidget(self.label_simulation_state)
        label_layout.addStretch(1)
        label_layout.addWidget(self.label_fps)

        left_layout = QVBoxLayout()
        left_layout.addWidget(self.boid_simulation_widget)
        left_layout.addLayout(label_layout)

        right_layout = QVBoxLayout()
        right_layout.addWidget(self.group_box_control)
        right_layout.addWidget(self.group_box_action)
        right_layout.addWidget(self.group_box_parameters)
        right_layout.addStretch(1)

        right_layout_widget = QWidget()
        right_layout_widget.setMaximumWidth(350)
        right_layout_widget.setLayout(right_layout)

        main_layout = QHBoxLayout()
        main_layout.addLayout(left_layout)
        main_layout.addWidget(right_layout_widget)

        widget = QWidget()
        sizePolicy = QSizePolicy(
            QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding)
        widget.setSizePolicy(sizePolicy)
        widget.setLayout(main_layout)

        self.setWindowTitle('NTNU IT3708 P1: Flocking and Avoidance with Boids -- permve@stud.ntnu.no')
        self.setCentralWidget(widget)

        self.update_fps_value(0.0)
        self.action_button_group.buttons()[0].setChecked(True)
        self.slider_frequency.setValue(50)

        self.show()

    def initialize_group_box_action(self):
        actions = [ ('Add Prey',        BoidSimulationWidget.Action.add_prey),
                    ('Add Predator',    BoidSimulationWidget.Action.add_predator),
                    ('Add Obstacle',    BoidSimulationWidget.Action.add_obstacle),
                    ('Delete Obstacle', BoidSimulationWidget.Action.delete_object) ]

        self.action_button_group = QButtonGroup()
        layout = QVBoxLayout()

        for label, action in actions:
            radio_button = QRadioButton(label)
            radio_button.toggled.connect(
                lambda is_set, action=action:
                    self.boid_simulation_widget.set_left_click_action(action) if is_set else None)

            self.action_button_group.addButton(radio_button)
            layout.addWidget(radio_button)

        self.group_box_action = QGroupBox('Left button action')
        self.group_box_action.setLayout(layout)

    def initialize_group_box_parameters(self):
        class ParameterWidgets(object):
            value_decimals = 5

            def __init__(self, parameter, parameter_manager):
                self.parameter         = parameter
                self.parameter_manager = parameter_manager

                self.is_parameter_int = type(parameter.default_value) is int
                self.parameter_delta  = self.parameter.max_value - self.parameter.min_value

                self.value_slider_steps = self.parameter.max_value + 1 if self.is_parameter_int else 1000
                self.value_slider_start = self.parameter.min_value if self.is_parameter_int else 0

                self.value_slider = QSlider(Qt.Horizontal)
                self.value_slider.setRange(self.value_slider_start, self.value_slider_steps - 1)
                self.value_slider.setTracking(True)
                self.value_slider.valueChanged.connect(self.slider_value_changed)

                self.name_label = QLabel(parameter.name.replace('_', ' ').title())

                self.value_text = QLineEdit()
                self.value_text.setFixedWidth(
                    int(1.5 * self.value_text.fontMetrics().boundingRect("100." + "0" * self.value_decimals).width()))

                if self.is_parameter_int:
                    self.value_text.setValidator(
                        QIntValidator(self.parameter.min_value, self.parameter.max_value))
                else:
                    self.value_text.setValidator(
                        QDoubleValidator(self.parameter.min_value, self.parameter.max_value, self.value_decimals))

                self.value_text.editingFinished.connect(self.text_editing_finished)

                value = self.parameter_manager.get_parameter_value(self.parameter)
                self.set_slider_value(value)
                self.set_text_value(value)

            def set_slider_value(self, value):
                if not self.is_parameter_int:
                    value = int(round(
                        ((value - self.parameter.min_value) *
                         (self.value_slider_steps - 1) / self.parameter_delta)))

                self.value_slider.setValue(value)

            def set_text_value(self, value):
                self.value_text.setText(('{0}' if self.is_parameter_int else '{0:.5f}').format(value))

            def slider_value_changed(self, value):
                if not self.is_parameter_int:
                    value = self.parameter.min_value + \
                            value * self.parameter_delta / (self.value_slider_steps - 1)

                self.set_text_value(value)
                self.parameter_manager.set_parameter_value(self.parameter, value)

            def text_editing_finished(self):
                value = float(self.value_text.text())
                self.set_slider_value(value)
                self.parameter_manager.set_parameter_value(self.parameter, value)

        layout = QGridLayout()
        self.parameter_widgets = []

        for index, parameter in enumerate(BoidSimulation.Parameter):
            parameter_widgets = ParameterWidgets(parameter, self.boid_simulation_widget)
            layout.addWidget(parameter_widgets.name_label,   index, 0)
            layout.addWidget(parameter_widgets.value_slider, index, 1)
            layout.addWidget(parameter_widgets.value_text,   index, 2)
            self.parameter_widgets.append(parameter_widgets)

        self.group_box_parameters = QGroupBox('Parameters')
        self.group_box_parameters.setLayout(layout)

    def initialize_group_box_control(self):
        self.slider_frequency = QSlider(Qt.Horizontal)
        self.slider_frequency.setRange(1, 100)
        self.slider_frequency.setTracking(True)
        self.slider_frequency.valueChanged.connect(self.handle_set_frequency)

        self.label_frequency = QLabel()

        layout_slider = QHBoxLayout()
        layout_slider.addWidget(self.slider_frequency)
        layout_slider.addWidget(self.label_frequency)

        self.button_step  = QPushButton("Step")
        self.button_step.clicked.connect(self.boid_simulation_widget.step)

        self.button_play  = QPushButton("Start")
        self.button_play.clicked.connect(self.boid_simulation_widget.toggle_play)

        layout_buttons = QHBoxLayout()
        layout_buttons.addWidget(self.button_step)
        layout_buttons.addWidget(self.button_play)

        layout = QVBoxLayout()
        layout.addLayout(layout_slider)
        layout.addLayout(layout_buttons)

        self.group_box_control = QGroupBox("Control")
        self.group_box_control.setLayout(layout)

    def closeEvent(self, e):
        self.boid_simulation_widget.stop()

    def handle_set_frequency(self, frequency):
        self.label_frequency.setText("{0} Hz".format(frequency))
        self.boid_simulation_widget.set_frequency(frequency)

    def update_fps_value(self, fps_value):
        self.label_fps.setText('{:.2f} FPS'.format(fps_value))

    def update_play_state(self, is_playing):
        self.button_play.setText('Stop' if is_playing else 'Start')

    def update_simulation_state(self, state):
        self.label_simulation_state.setText(state)

def main():
    #sim = BoidSimulation()

    #for _ in range(500):
    #    sim.spawn_random_prey()

    #for _ in range(100):
    #    sim.step()

    #return

    app = QApplication(sys.argv)
    boid_application = BoidApplication()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
