#!/usr/bin/python3

import collections
import enum
import math
import numpy
import os
import random
import sys
import threading
import time

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *

class Boid(object):
    def __init__(self, position, velocity, radius):
        self.position = position
        self.velocity = velocity
        self.radius   = radius

    def heading(self):
        velocity_magnitude = numpy.linalg.norm(self.velocity)

        if velocity_magnitude:
            normalized_velocity = self.velocity / velocity_magnitude
            return numpy.arctan2(normalized_velocity[1], normalized_velocity[0])
        else:
            return 0.0

class BoidSimulationWidget(QWidget):

    class Action(enum.Enum):
        add_prey      = 1
        add_predator  = 2
        add_obstacle  = 3
        delete_object = 4

    class Parameter(enum.Enum):
        separation            = (1, 0.0, 10.0, 2.5)
        alignment             = (2, 0.0, 10.0, 2.5)
        cohesion              = (3, 0.0, 10.0, 2.5)
        neighbor_distance     = (4, 1.0, 50.0, 25.0)
        max_prey_velocity     = (5, 0.1, 10.0, 2.5)
        max_predator_velocity = (5, 0.1, 10.0, 5.0)

        def __init__(self, identity, min_value, max_value, default_value):
            self.identity      = identity
            self.min_value     = min_value
            self.max_value     = max_value
            self.default_value = default_value

    colors = {
        'background': QColor(255, 255, 255),
        'prey':       QColor(114, 191, 68),
        'predator':   QColor(215, 53, 38),
    }

    def __init__(self,
                 parent,
                 simulation_state_listener,
                 play_state_listener,
                 fps_listener):

        super(BoidSimulationWidget, self).__init__(parent)

        self.simulation_state_listener = simulation_state_listener
        self.play_state_listener       = play_state_listener
        self.fps_listener              = fps_listener

        self.setSizePolicy(QSizePolicy(
            QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding))

        self.drawing_lock      = threading.Lock()
        self.left_click_action = BoidSimulationWidget.Action.add_prey
        self.frequency         = 1
        self.play_thread       = None
        self.is_playing        = False

        self.world_size     = (1.0, 1.0)
        self.predator_boids = []
        self.prey_boids     = []

        self.__initialize_paints()

        self.parameters = {}
        for parameter in BoidSimulationWidget.Parameter:
            self.set_parameter_value(parameter, parameter.default_value)

        self.frame_timings      = collections.deque(maxlen=100)
        self.fps_update_counter = 0

        self.__post_simulation_state()
        self.fps_listener(0)

    def __build_random_boid(self, velocity_magnitude, radius):
        random_position = numpy.array([
            random.random() * self.world_size[0],
            random.random() * self.world_size[1]])

        velocity_direction = random.uniform(-math.pi, math.pi)

        random_velocity = numpy.array([
            math.cos(velocity_direction) * velocity_magnitude,
            math.sin(velocity_direction) * velocity_magnitude])

        return Boid(random_position, random_velocity, radius)

    def __calculate_prey_neighbors(self, prey):
        return [other for other in self.prey_boids
                if other is not prey and
                math.hypot(other.position[1] - prey.position[1], other.position[0] - prey.position[0])
                    <= self.get_parameter_value(BoidSimulationWidget.Parameter.neighbor_distance)]

    def __initialize_paints(self):
        self.boid_pen         = QPen(QBrush(Qt.black), 2.0)
        self.border_pen       = QPen(QBrush(Qt.black), 0)

        self.background_brush = QBrush(BoidSimulationWidget.colors['background'])
        self.predator_brush   = QBrush(BoidSimulationWidget.colors['predator'])
        self.prey_brush       = QBrush(BoidSimulationWidget.colors['prey'])

    def __post_simulation_state(self):
        num_prey      = len(self.prey_boids)
        num_predators = len(self.predator_boids)

        self.simulation_state_listener(
            'Boids: {0}\tPrey: {1}\tPredators: {2}\tObstacles: {3}'.format(
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

            self.fps_listener(fps)
            self.fps_update_counter = 0

        self.frame_timings.append(time_b)
        self.fps_update_counter += 1

    def get_left_click_action(self):
        return self.left_click_action

    def get_parameter_value(self, parameter):
        return self.parameters[parameter]

#    def mouseMoveEvent(self, event):
#        if self.focus_boid:
#            new_velocity = numpy.array([float(event.x()), float(event.y())]) - self.focus_boid.position
#            new_velocity_magnitude = numpy.linalg.norm(new_velocity)
#
#            if new_velocity_magnitude and new_velocity_magnitude > self.get_parameter_value(BoidSimulationWidget.Parameter.max_velocity):
#                new_velocity = new_velocity / new_velocity_magnitude * self.get_parameter_value(BoidSimulationWidget.Parameter.max_velocity)
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

    def mouseReleaseEvent(self, event):
        #self.focus_boid = None
        self.spawn_random_prey()
        self.update()

    def paintEvent(self, event):
        def paint_boid(painter, boid):
            painter.drawEllipse(
                QPointF(boid.position[0], boid.position[1]),
                boid.radius, boid.radius)

            # Draw direction indicator
            velocity_magnitude = numpy.linalg.norm(boid.velocity)
            if velocity_magnitude:
                direction = boid.velocity / velocity_magnitude
                a = boid.position + boid.radius * 0.8 * direction
                b = boid.position + boid.radius * 1.2 * direction
                painter.drawLine(QPointF(a[0], a[1]), QPointF(b[0], b[1]))

        with self.drawing_lock:
            painter = QPainter(self)
            painter.setRenderHint(QPainter.Antialiasing, True)

            # Draw background with border
            painter.fillRect(event.rect(), self.background_brush)
            painter.setPen(self.border_pen)
            painter.drawRect(event.rect())

            # Draw prey boids
            painter.setPen(self.boid_pen)
            painter.setBrush(self.prey_brush)

            for prey in self.prey_boids:
                paint_boid(painter, prey)

#                neighbors = self.__calculate_prey_neighbors(prey)
#                if neighbors:
#                    cohesion_vector = numpy.mean(list(neighbor.position for neighbor in neighbors), axis=0)
#
#                    painter.setPen(QPen(QBrush(Qt.red), 0))
#                    painter.drawLine(QPointF(prey.position[0], prey.position[1]), QPointF(cohesion_vector[0], cohesion_vector[1]))
#                    painter.setPen(self.boid_pen)




#                neighbors = calculate_neighbors(boid)
#
#                if neighbors:
#                    print(neighbors)
#
#                    print(numpy.mean(list(neighbor.position for neighbor in neighbors)))
#
#                    cohesion = self.get_parameter_value(BoidSimulationWidget.Parameter.cohesion) * \
#                               (numpy.mean(list(neighbor.position for neighbor in neighbors)) - boid.position)

            # Draw predator boids
            painter.setBrush(self.predator_brush)

            for predator in self.predator_boids:
                paint_boid(painter, predator)

    def play(self):
        while self.is_playing:
            time.sleep(1.0 / self.frequency)
            self.step()
            self.__update_fps()

    def resizeEvent(self, event):
        self.world_size = (float(event.size().width()), float(event.size().height()))

    def set_parameter_value(self, parameter, value):
        self.parameters[parameter] = value

    def set_frequency(self, frequency):
        self.frequency = frequency

    def set_left_click_action(self, action):
        self.left_click_action = action

    def set_playing(self, is_playing):
        self.is_playing = is_playing
        self.play_state_listener(is_playing)

    def sizeHint(self):
        return QSize(500, 500)

    def spawn_random_predator(self, count):
        self.predator_boids.append(self.__build_random_boid(
            self.get_parameter_value(BoidSimulationWidget.Parameter.max_predator_velocity), 20.0))
        self.__post_simulation_state()

    def spawn_random_prey(self):
        self.prey_boids.append(self.__build_random_boid(
            self.get_parameter_value(BoidSimulationWidget.Parameter.max_prey_velocity), 12.0))
        self.__post_simulation_state()

    def step(self):
        with self.drawing_lock:
            for boid in self.prey_boids:
                neighbors = self.__calculate_prey_neighbors(boid)

                if neighbors:
                    cohesion = self.get_parameter_value(BoidSimulationWidget.Parameter.cohesion) * \
                               (numpy.mean(list(neighbor.position for neighbor in neighbors), axis=0) - boid.position)

                    alignment = self.get_parameter_value(BoidSimulationWidget.Parameter.alignment) * \
                                numpy.mean(list(neighbor.velocity for neighbor in neighbors), axis=0)

                    #for neighbor in neighbors:
                    #    difference = boid.position - neighbor.position
                    #    difference_magnitude = numpy.linalg.norm(difference)

                    #    if difference_magnitude > separation_distance:
                    #        difference / (difference_magnitude * difference_magnitude)
                    #boid.position - neighbor.position for neighbor in neighbors

                    boid.velocity += cohesion + alignment

                velocity_magnitude = numpy.linalg.norm(boid.velocity)

                if velocity_magnitude > self.get_parameter_value(BoidSimulationWidget.Parameter.max_prey_velocity):

                    boid.velocity = boid.velocity / velocity_magnitude * self.get_parameter_value(BoidSimulationWidget.Parameter.max_prey_velocity)
#
                boid.position += boid.velocity
#        if velocity_magnitude:
#            normalized_velocity = self.velocity / velocity_magnitude
#            return numpy.arctan2(normalized_velocity[1], normalized_velocity[0])




        #for boid in self.boids:
        #    neighbors = self.neighbors(boid)

        #    if neighbors:
        #        sine_sum = 0.0
        #        cosine_sum = 0.0

        #        for neighbor in neighbors:
        #            angle       = math.atan2(neighbor.y - boid.y, neighbor.x - boid.x)
        #            sine_sum   += math.sin(angle)
        #            cosine_sum += math.cos(angle)

        #        alignment  = self.get_parameter_value(BoidSimulationWidget.Parameter.alignment)
        #        angle      = math.atan2(sine_sum, cosine_sum)
        #        boid.align = (math.sin(angle) * alignment, math.cos(angle) * alignment)


            #velocity_x = math.cos(boid.angle) * boid.velocity
            #velocity_y = math.sin(boid.angle) * boid.velocity

            #if boid.align:
            #    boid.x += boid.align[0]
            #    boid.y += boid.align[1]

            #boid.

            #boid.x = boid.new_x
            #boid.y = boid.new_y

        self.update()

    def stop(self):
        self.set_playing(False)
        if self.play_thread:
            self.play_thread.join()

    def toggle_play(self):
        if not self.is_playing:
            self.set_playing(True)
            self.play_thread = threading.Thread(target=self.play)
            self.play_thread.start()
        else:
            self.set_playing(False)

class BoidApplication(QMainWindow):
    def __init__(self):
        super(BoidApplication, self).__init__()

        self.label_simulation_state = QLabel()
        self.label_fps              = QLabel()

        self.boid_simulation_widget = BoidSimulationWidget(
            self,
            self.update_simulation_state,
            self.update_play_state,
            self.update_fps_value)

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

        main_layout = QHBoxLayout()
        main_layout.addLayout(left_layout)
        main_layout.addLayout(right_layout)

        widget = QWidget()
        sizePolicy = QSizePolicy(
            QSizePolicy.MinimumExpanding, QSizePolicy.MinimumExpanding)
        widget.setSizePolicy(sizePolicy)
        widget.setLayout(main_layout)

        self.setSizePolicy(sizePolicy)

        self.setWindowTitle('NTNU IT3708 P1: Flocking and Avoidance with Boids -- permve@stud.ntnu.no')
        self.setCentralWidget(widget)

        self.action_button_group.buttons()[0].setChecked(True)
        self.slider_frequency.setValue(50)

        self.show()

#%    def event(self, e):
#%        if e.type() == QEvent.LayoutRequest:
#%            self.setFixedSize(self.sizeHint())
#%
#%        return super(BoidApplication, self).event(e)

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
            def __init__(self, parameter, boid_simulation_widget):
                self.parameter              = parameter
                self.boid_simulation_widget = boid_simulation_widget

                self.value_decimals     = 5
                self.value_slider_steps = 1000

                self.parameter_delta = self.parameter.max_value - self.parameter.min_value

                self.value_slider = QSlider(Qt.Horizontal)
                self.value_slider.setRange(0, self.value_slider_steps - 1)
                self.value_slider.setTracking(True)
                self.value_slider.valueChanged.connect(self.slider_value_changed)

                self.name_label = QLabel(parameter.name.replace('_', ' ').title())

                self.value_text = QLineEdit()
                self.value_text.setFixedWidth(
                    int(1.5 * self.value_text.fontMetrics().boundingRect("100." + "0" * self.value_decimals).width()))
                self.value_text.setValidator(
                    QDoubleValidator(self.parameter.min_value, self.parameter.max_value, self.value_decimals))
                self.value_text.editingFinished.connect(self.text_editing_finished)

                value = self.boid_simulation_widget.get_parameter_value(self.parameter)
                self.set_slider_value(value)
                self.set_text_value(value)

            def set_slider_value(self, value):
                value_slider_value = int(round(
                    ((value - self.parameter.min_value) *
                     (self.value_slider_steps - 1) / self.parameter_delta)))

                self.value_slider.setValue(value_slider_value)

            def set_text_value(self, value):
                self.value_text.setText('{0:.5f}'.format(value))

            def slider_value_changed(self, value_slider_value):
                value = self.parameter.min_value + \
                        value_slider_value * self.parameter_delta / (self.value_slider_steps - 1)

                self.set_text_value(value)
                self.boid_simulation_widget.set_parameter_value(self.parameter, value)

            def text_editing_finished(self):
                value = float(self.value_text.text())
                self.set_slider_value(value)
                self.boid_simulation_widget.set_parameter_value(self.parameter, value)

        layout = QGridLayout()
        self.parameter_widgets = []

        for index, parameter in enumerate(BoidSimulationWidget.Parameter):
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
    app = QApplication(sys.argv)
    boid_application = BoidApplication()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
