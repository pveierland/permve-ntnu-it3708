import os
import sys
import time
import threading
import numpy
import random
import enum

from PyQt5.QtCore import *
from PyQt5.QtGui import *
from PyQt5.QtWidgets import *
from PyQt5.QtQuick import *

class GameState(enum.Enum):
    initial    = 1
    move_up    = 2
    move_down  = 3
    move_left  = 4
    move_right = 5

@enum.unique
class GameEntity(enum.Enum):
    void            = 0
    agent           = 1
    dot             = 2
    food_cherry     = 3
    food_strawberry = 4
    food_orange     = 5
    food_apple      = 6
    food_melon      = 7
    enemy_red       = 8
    enemy_pink      = 9
    enemy_cyan      = 10
    enemy_orange    = 11

game_food_entities = [
    GameEntity.food_cherry,
    GameEntity.food_strawberry,
    GameEntity.food_orange,
    GameEntity.food_apple,
    GameEntity.food_melon ]

game_enemy_entities = [
    GameEntity.enemy_red,
    GameEntity.enemy_pink,
    GameEntity.enemy_cyan,
    GameEntity.enemy_orange ]

class GameWidget(QWidget):
    def __init__(self, parent=None):
        super(GameWidget, self).__init__(parent)

        self.setSizePolicy(QSizePolicy(
            QSizePolicy.Fixed, QSizePolicy.Fixed))

        self.is_alive        = False
        self.play_thread     = None
        self.animation_index = 0
        self.animation_indexes = {}
        self.frequency = 17
        self.game_state = GameState.initial
        self.agent_position = None
        self.game_time = 0

        self.sprite  = QPixmap('data/pacman-general-sprites.png')
        self.sprites = {
            GameEntity.food_cherry: QRect(488, 48, 16, 16),
            GameEntity.food_strawberry: QRect(504, 48, 16, 16),
            GameEntity.food_orange: QRect(520, 48, 16, 16),
            GameEntity.food_apple: QRect(536, 48, 16, 16),
            GameEntity.food_melon: QRect(552, 48, 16, 16),
            'corner_upper_left': QRect(0, 0, 5, 5),
            'corner_upper_right': QRect(219, 0, 5, 5),
            'corner_lower_left': QRect(0, 243, 5, 5),
            'corner_lower_right': QRect(219, 243, 5, 5),
            'edge_upper': QRect(5, 0, 16, 5),
            'edge_lower': QRect(5, 243, 16, 5),
            'edge_left': QRect(0, 5, 5, 16),
            'edge_right': QRect(219, 5, 5, 16),
            GameEntity.dot: QRect(11, 11, 2, 2),
        }

        self.ghost_sprites = {
            GameEntity.enemy_red: [
                QRect(456, 64, 16, 16), QRect(472, 64, 16, 16),
                QRect(488, 64, 16, 16), QRect(504, 64, 16, 16),
                QRect(520, 64, 16, 16), QRect(536, 64, 16, 16),
                QRect(552, 64, 16, 16), QRect(568, 64, 16, 16) ],
            GameEntity.enemy_pink: [
                QRect(456, 80, 16, 16), QRect(472, 80, 16, 16),
                QRect(488, 80, 16, 16), QRect(504, 80, 16, 16),
                QRect(520, 80, 16, 16), QRect(536, 80, 16, 16),
                QRect(552, 80, 16, 16), QRect(568, 80, 16, 16) ],
            GameEntity.enemy_cyan: [
                QRect(456, 96, 16, 16), QRect(472, 96, 16, 16),
                QRect(488, 96, 16, 16), QRect(504, 96, 16, 16),
                QRect(520, 96, 16, 16), QRect(536, 96, 16, 16),
                QRect(552, 96, 16, 16), QRect(568, 96, 16, 16) ],
            GameEntity.enemy_orange: [
                QRect(456, 112, 16, 16), QRect(472, 112, 16, 16),
                QRect(488, 112, 16, 16), QRect(504, 112, 16, 16),
                QRect(520, 112, 16, 16), QRect(536, 112, 16, 16),
                QRect(552, 112, 16, 16), QRect(568, 112, 16, 16) ] }

        self.agent_movement_sprites = [
            [ QRect(456, 32, 16, 16), QRect(472, 32, 16, 16) ],
            [ QRect(456, 48, 16, 16), QRect(472, 48, 16, 16) ],
            [ QRect(456, 16, 16, 16), QRect(472, 16, 16, 16) ],
            [ QRect(456,  0, 16, 16), QRect(472,  0, 16, 16) ] ]

        self.agent_sprite        = QRect(488, 0, 16, 16)
        self.agent_death_sprites = [QRect(504 + i * 16, 0, 16, 16) for i in range(11)]

        self.scaling = 4
        self.x_cells = 10
        self.y_cells = 10

        self.grid = self.generate_grid(1/3, 1/3)

    def generate_grid(self, f, p):

        grid = numpy.full((2 * self.y_cells - 1, 2 * self.x_cells - 1), GameEntity.void, dtype=object)

        num_grid_cells  = self.y_cells * self.x_cells
        num_food_cells  = int(round(f * num_grid_cells))
        num_enemy_cells = int(round(p * (num_grid_cells - num_food_cells)))

        grid_cells  = list(2 * x + 2 * y * (2 * self.x_cells - 1) for x in range(self.x_cells) for y in range(self.y_cells))
        agent_cell  = random.choice(grid_cells)
        food_cells  = random.sample(list(set(grid_cells) - set([agent_cell])), num_food_cells)
        enemy_cells = random.sample(list(set(grid_cells) - set([agent_cell]) - set(food_cells)), num_enemy_cells)

        self.agent_position = numpy.unravel_index(agent_cell, grid.shape)

        for i in food_cells:
            grid.flat[i] = random.choice(game_food_entities)

        for i in enemy_cells:
            grid.flat[i] = random.choice(game_enemy_entities)
            self.animation_indexes[numpy.unravel_index(i, grid.shape)] = random.choice(range(8))

        for y in range(2 * self.y_cells - 1):
            for x in range(0, 2 * self.x_cells - 1, 2):
                neighbors = grid[y - 1:y + 2, x - 1:x + 2]
                if numpy.all(numpy.logical_or(neighbors == GameEntity.dot, neighbors == GameEntity.void)):
                    grid[y, x] = GameEntity.dot

        for y in range(0, 2 * self.y_cells - 1, 2):
            for x in range(2 * self.x_cells - 1):
                neighbors = grid[y - 1:y + 2, x - 1:x + 2]
                if numpy.all(numpy.logical_or(neighbors == GameEntity.dot, neighbors == GameEntity.void)):
                    grid[y, x] = GameEntity.dot

        return grid

    def paintEvent(self, event):
        painter = QPainter(self)
        #painter.setRenderHint(QPainter.Antialiasing, True)
        painter.setBrush(QBrush(Qt.black))
        painter.setBackground(QBrush(Qt.black))
        painter.eraseRect(event.rect())

        painter.scale(self.scaling, self.scaling)

        width  = self.width() / self.scaling
        height = self.height() / self.scaling

        #for x in range(0, self.x_cells):
        #    painter.drawPixmap(QPoint(5 + 16 * x, 0), self.sprite, self.sprites['edge_upper'])
        #    painter.drawPixmap(QPoint(5 + 16 * x, height - 5), self.sprite, self.sprites['edge_lower'])

        #for y in range(0, self.y_cells):
        #    painter.drawPixmap(QPoint(0, 5 + 16 * y), self.sprite, self.sprites['edge_left'])
        #    painter.drawPixmap(QPoint(width - 5, 5 + 16 * y), self.sprite, self.sprites['edge_right'])

        #painter.drawPixmap(QPoint(0, 0), self.sprite, self.sprites['corner_upper_left'])
        #painter.drawPixmap(QPoint(width - 5, 0), self.sprite, self.sprites['corner_upper_right'])
        #painter.drawPixmap(QPoint(0, height - 5), self.sprite, self.sprites['corner_lower_left'])
        #painter.drawPixmap(QPoint(width - 5, height - 5), self.sprite, self.sprites['corner_lower_right'])

        #for y in range(2 * self.y_cells - 1):
        #    for x in range(0, 2 * self.x_cells - 1):
        #        if self.grid[y, x] is GameEntity.dot:
        #            painter.drawPixmap(QPoint(7 + 8 * x, 7 + 8 * y), self.sprite, self.sprites[GameEntity.dot])

        #for y in range(self.y_cells):
        #    for x in range(self.x_cells):
        #        value = self.grid[y * 2, x * 2]
        #        if value in game_food_entities:
        #            painter.drawPixmap(QPoint(16 * x,16 * y), self.sprite, self.sprites[value])
        #        elif value in game_enemy_entities:
        #            painter.drawPixmap(QPoint(16 * x, 16 * y), self.sprite, self.ghost_sprites[value][
        #                (self.animation_indexes[(2 * y, 2 * x)] + self.animation_index) % 8])

        #if self.game_state is GameState.initial:
        #    painter.drawPixmap(QPoint(16 * self.agent_position[1] / 2, 16 * self.agent_position[0] / 2), self.sprite, self.agent_sprite)
        #elif self.game_state is GameState.move_left:
        #    painter.drawPixmap(QPoint(16 * self.agent_position[1] / 2 - self.game_time,
        #                              16 * self.agent_position[0] / 2),
        #                       self.sprite, self.agent_movement_sprites[2][self.game_time % 2])

        sprite_index = self.game_time % 4
        if sprite_index == 3:
            sprite_index = 1

        painter.drawPixmap(QPoint(16 * self.agent_position[1] / 2,
                                  16 * self.agent_position[0] / 2),
                           self.sprite, [self.agent_sprite, self.agent_movement_sprites[2][1], self.agent_movement_sprites[2][0]][sprite_index])

    def play(self):
        start_time = time.monotonic()
        sleep_time = 1 / self.frequency

        while self.is_alive:
            self.game_time += 1
            #if self.game_state is GameState.initial:
            #    if self.game_time == 20:
            #        self.game_time = 0
            #        self.game_state = GameState.move_left
            #    else:
            #        self.game_time += 1
            #elif self.game_state is GameState.move_left:
            #    if self.game_time == 16:
            #        self.agent_position = (self.agent_position[0], self.agent_position[1] - 2)
            #        self.game_time = 0
            #        self.game_state = GameState.move_left
            #    else:
            #        self.game_time += 1

            #self.animation_index = (self.animation_index + 1) % 8

            time_now    = time.monotonic()
            start_time += sleep_time

            if start_time > time_now:
                time.sleep(start_time - time_now)
                self.update()

    def sizeHint(self):
        return QSize(self.scaling * self.x_cells * 16,
                     self.scaling * self.y_cells * 16)

    def start(self):
        if not self.is_alive:
            self.is_alive = True
            self.play_thread = threading.Thread(target=self.play)
            self.play_thread.start()

    def stop(self):
        if self.is_alive:
            self.is_alive = False
            self.play_thread.join()

class FlatlandApplication(QMainWindow):
    def __init__(self):
        super(FlatlandApplication, self).__init__()

        #self.game_widget = GameWidget(self)

        #widget = QWidget()
        #sizePolicy = QSizePolicy(
        #    QSizePolicy.Fixed, QSizePolicy.Fixed)
        #widget.setSizePolicy(sizePolicy)
        #widget.setLayout(layout)

        #self.setSizePolicy(sizePolicy)

        view = QQuickView()
        container = QWidget.createWindowContainer(view, self)
        container.setFixedSize(640, 640)
        view.setSource(QUrl('wtf.qml'))

#        def wtf(s):
#            print(s)

#        view.rootObject().wtf.connect(wtf)

        view.rootObject().loadComponents()

        view.rootObject().setGrid(10, 10, [
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 8, 0, 9, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 10, 0, 11, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ,
             0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ])

#        view.rootContext().setContextProperty('balls', wtf)

        self.setWindowTitle('NTNU IT3708 2016 P3: Evolving Neural Networks for a Flatland agent -- permve@stud.ntnu.no')
        #self.setCentralWidget(self.game_widget)
        self.setCentralWidget(container)
        self.show()

        #self.game_widget.start()

    def closeEvent(self, e):
        self.game_widget.stop()

    def event(self, e):
        if e.type() == QEvent.LayoutRequest:
            self.setFixedSize(self.sizeHint())

        return super(FlatlandApplication, self).event(e)

def main():
    app = QApplication(sys.argv)
    search_application = FlatlandApplication()
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
