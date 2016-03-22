(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ViFlatland = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WorldEntity = exports.Heading = exports.Action = exports.World = undefined;
exports.generateRandomWorld = generateRandomWorld;
exports.buildGameModelFromWorldModel = buildGameModelFromWorldModel;
exports.evaluateRun = evaluateRun;

var _viFlatlandWorld = require('../vi-flatland-world/vi-flatland-world');

var World = _interopRequireWildcard(_viFlatlandWorld);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.World = World;
var Action = exports.Action = {
    stay: 1, moveLeft: 2, moveForward: 3, moveRight: 4
};

var Heading = exports.Heading = {
    up: 0, right: 1, down: 2, left: 3
};

var WorldEntity = exports.WorldEntity = Object.freeze({
    void: 0, food: 1, poison: 2
});

var Utility = Object.freeze(function () {
    var utility = {};

    utility.clearGridNeighbors = function (cells, x, y, width, height) {
        if (x > 0) {
            cells[y * width + x - 1] = 0;
        }
        if (x < width - 1) {
            cells[y * width + x + 1] = 0;
        }
        if (y > 0) {
            cells[(y - 1) * width + x] = 0;
        }
        if (y < height - 1) {
            cells[(y + 1) * width + x] = 0;
        }
    };

    utility.getRandomIntInclusive = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    utility.shuffle = function (array) {
        var currentIndex = array.length,
            temporaryValue,
            randomIndex;

        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    };

    return utility;
}());

function generateRandomWorld(worldWidth, worldHeight, foodProbability, poisonProbability) {
    var numWorldCells = worldWidth * worldHeight;
    var numFoodCells = Math.round(foodProbability * numWorldCells);
    var numPoisonCells = Math.round(poisonProbability * (numWorldCells - numFoodCells));

    var worldCells = new Array(numWorldCells).fill(WorldEntity.void);

    var availableCells = Utility.shuffle(worldCells.map(function (cv, i) {
        return i;
    }));
    var foodCells = availableCells.splice(0, numFoodCells);
    var poisonCells = availableCells.splice(0, numPoisonCells);
    var agentCell = availableCells.splice(0, 1)[0];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = foodCells[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var foodCell = _step.value;

            worldCells[foodCell] = WorldEntity.food;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
        for (var _iterator2 = poisonCells[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var poisonCell = _step2.value;

            worldCells[poisonCell] = WorldEntity.poison;
        }
    } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
            }
        } finally {
            if (_didIteratorError2) {
                throw _iteratorError2;
            }
        }
    }

    return {
        cells: worldCells,
        width: worldWidth,
        height: worldHeight,
        foodProbability: foodProbability,
        poisonProbability: poisonProbability,
        agent: {
            x: agentCell % worldWidth,
            y: Math.floor(agentCell / worldWidth),
            heading: Utility.getRandomIntInclusive(Heading.up, Heading.right)
        }
    };
}

function buildGameModelFromWorldModel(world) {
    var gridWidth = 2 * world.width - 1;
    var gridHeight = 2 * world.height - 1;
    var numGridCells = gridWidth * gridHeight;

    var gridCells = new Array(numGridCells).fill(World.GameEntity.void);

    // Place dots
    for (var y = 0; y < gridHeight; y += 1) {
        for (var x = 0; x < gridWidth; x += 1) {
            if (y % 2 == 0 || x % 2 == 0) {
                var index = y * gridWidth + x;
                gridCells[index] = World.GameEntity.dot;
            }
        }
    }

    // Place fruits and enemies
    for (var row = 0; row < world.height; row += 1) {
        for (var column = 0; column < world.width; column += 1) {
            var worldIndex = row * world.width + column;
            var worldValue = world.cells[worldIndex];
            var gridIndex = 2 * row * gridWidth + 2 * column;

            var gridValue = World.GameEntity.void;

            if (worldValue === WorldEntity.food) {
                gridValue = Utility.shuffle(World.Constants.food.slice())[0];
            } else if (worldValue === WorldEntity.poison) {
                gridValue = Utility.shuffle(World.Constants.enemies.slice())[0];
            }

            if (gridValue !== World.GameEntity.void) {
                gridCells[gridIndex] = gridValue;
                Utility.clearGridNeighbors(gridCells, 2 * column, 2 * row, gridWidth, gridHeight);
            }
        }
    }

    gridCells[2 * world.agent.y * gridWidth + 2 * world.agent.x] = 0;
    Utility.clearGridNeighbors(gridCells, 2 * world.agent.x, 2 * world.agent.y, gridWidth, gridHeight);

    return {
        cells: gridCells,
        width: gridWidth,
        height: gridHeight,
        agent: {
            x: world.agent.x * 2,
            y: world.agent.y * 2
        }
    };
}

function evaluateRun(world, actions) {
    actions = actions.slice();
    world = JSON.parse(JSON.stringify(world));

    var foodEaten = 0,
        poisonEaten = 0;

    while (actions.length > 0) {
        var action = actions.shift();

        if (action !== Action.stay) {
            switch (action) {
                case Action.moveLeft:
                    {
                        world.agent.heading = (world.agent.heading - 1 + 4) % 4;
                        break;
                    }
                case Action.moveRight:
                    {
                        world.agent.heading = (world.agent.heading + 1) % 4;
                        break;
                    }
            }

            switch (world.agent.heading) {
                case Heading.up:
                    {
                        world.agent.y = (world.agent.y - 1 + world.height) % world.height;
                        break;
                    }
                case Heading.down:
                    {
                        world.agent.y = (world.agent.y + 1) % world.height;
                        break;
                    }
                case Heading.left:
                    {
                        world.agent.x = (world.agent.x - 1 + world.width) % world.width;
                        break;
                    }
                case Heading.right:
                    {
                        world.agent.x = (world.agent.x + 1) % world.width;
                        break;
                    }
            }

            var entity = world.cells[world.agent.y * world.width + world.agent.x];

            switch (entity) {
                case WorldEntity.food:
                    {
                        foodEaten += 1;
                        break;
                    }
                case WorldEntity.poison:
                    {
                        poisonEaten += 1;
                        break;
                    }
            }
        }
    }

    return { foodEaten: foodEaten, poisonEaten: poisonEaten };
}

//function translateRelativeActions(initialHeading, actions)
//{
//    actions = actions.slice();
//
//    while (actions.length > 0)
//    {
//        if (action
//    }
//
//
//}

//const world  = generateRandomWorld(10, 10, 1/3, 1/3);
//const result = evaluateRun(world, new Array(60).map(_ => Utility.getRandomIntInclusive(Action.stay, Action.moveRight)));
//
//console.log(JSON.stringify(result));

//       this.model = buildGameModelFromWorldModel(
//            generateRandomWorld(options.worldWidth, options.worldHeight, 1/3, 1/3));

},{"../vi-flatland-world/vi-flatland-world":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Action = exports.Action = Object.freeze({
    stay: 1,
    moveUp: 2,
    moveDown: 3,
    moveLeft: 4,
    moveRight: 5
});

var GameEntity = exports.GameEntity = Object.freeze({
    void: 0,
    dot: 1,
    cherry: 2,
    strawberry: 3,
    orange: 4,
    apple: 5,
    melon: 6,
    blinky: 7,
    pinky: 8,
    inky: 9,
    clyde: 10
});

var Constants = exports.Constants = Object.freeze(function () {
    var constants = {};

    constants.animationDivider = 8;
    constants.gameLoopDelayMs = 1000 / 30;

    constants.food = [GameEntity.cherry, GameEntity.strawberry, GameEntity.orange, GameEntity.apple, GameEntity.melon];

    constants.enemies = [GameEntity.blinky, GameEntity.pinky, GameEntity.inky, GameEntity.clyde];

    constants.spriteInfo = {};
    constants.spriteInfo[GameEntity.dot] = { x: 176, y: 0, frames: 1 };
    constants.spriteInfo[GameEntity.cherry] = { x: 192, y: 0, frames: 1 };
    constants.spriteInfo[GameEntity.strawberry] = { x: 192, y: 16, frames: 1 };
    constants.spriteInfo[GameEntity.orange] = { x: 192, y: 32, frames: 1 };
    constants.spriteInfo[GameEntity.apple] = { x: 192, y: 48, frames: 1 };
    constants.spriteInfo[GameEntity.melon] = { x: 192, y: 64, frames: 1 };
    constants.spriteInfo[GameEntity.blinky] = { x: 160, y: 16, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.pinky] = { x: 160, y: 32, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.inky] = { x: 160, y: 48, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.clyde] = { x: 64, y: 64, frames: 8, divider: 8 };

    constants.agentSpriteInfo = {};
    constants.agentSpriteInfo[Action.stay] = { x: 0, y: 16, frames: 1 };
    constants.agentSpriteInfo[Action.moveUp] = { x: 0, y: 16, frames: 4 };
    constants.agentSpriteInfo[Action.moveDown] = { x: 0, y: 32, frames: 4 };
    constants.agentSpriteInfo[Action.moveLeft] = { x: 0, y: 48, frames: 4 };
    constants.agentSpriteInfo[Action.moveRight] = { x: 0, y: 64, frames: 4 };

    return constants;
}());

var Utility = exports.Utility = Object.freeze(function () {
    var utility = {};

    utility.getRandomIntInclusive = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    utility.isEnemy = function (entity) {
        return entity >= GameEntity.blinky && entity <= GameEntity.clyde;
    };

    utility.isFood = function (entity) {
        return entity >= GameEntity.cherry && entity <= GameEntity.melon;
    };

    return utility;
}());

var FlatlandWorld = exports.FlatlandWorld = function () {
    function FlatlandWorld(options) {
        _classCallCheck(this, FlatlandWorld);

        this.stepCallback = options.stepCallback || null;
        this.model = options.model || null;

        this.resetGameState();

        this.canvas = document.getElementById(options.elementId);
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle = 'black';

        this.sprites = new Image();
        this.sprites.onload = window.requestAnimationFrame.bind(window, this.update.bind(this));
        this.sprites.src = 'vi-flatland-world-sprites.png';
    }

    _createClass(FlatlandWorld, [{
        key: 'computeAgentSpritePositions',
        value: function computeAgentSpritePositions() {
            var x = this.model.agent.x * 8;
            var y = this.model.agent.y * 8;
            var cloneX = x,
                cloneY = y;

            var currentAction = this.currentAction;

            if (currentAction && currentAction !== Action.stayPut) {
                var movementOffset = 2 * this.movementIndex;

                switch (currentAction) {
                    case Action.moveUp:
                        {
                            y -= movementOffset;
                            cloneY = y < 0 ? y + 8 * (this.model.height + 1) : y;
                            break;
                        }
                    case Action.moveDown:
                        {
                            y += movementOffset;
                            cloneY = y >= 8 * (this.model.height - 1) ? y - 8 * (this.model.height + 1) : y;
                            break;
                        }
                    case Action.moveLeft:
                        {
                            x -= movementOffset;
                            cloneX = x < 0 ? x + 8 * (this.model.width + 1) : x;
                            break;
                        }
                    case Action.moveRight:
                        {
                            x += movementOffset;
                            cloneX = x >= 8 * (this.model.width - 1) ? x - 8 * (this.model.width + 1) : x;
                            break;
                        }
                }
            }

            return [{ x: x, y: y }, { x: cloneX, y: cloneY }];
        }
    }, {
        key: 'computeTargetCell',
        value: function computeTargetCell(position, action, steps) {
            switch (action) {
                case Action.stayPut:
                    {
                        return position;
                    }
                case Action.moveUp:
                    {
                        var y = position.y - steps;
                        return { x: position.x,
                            y: y < 0 ? y + this.model.height + 1 : y };
                    }
                case Action.moveDown:
                    {
                        var _y = position.y + steps;
                        return { x: position.x,
                            y: _y >= this.model.height ? _y - this.model.height - 1 : _y };
                    }
                case Action.moveLeft:
                    {
                        var x = position.x - steps;
                        return { x: x < 0 ? x + this.model.width + 1 : x,
                            y: position.y };
                    }
                case Action.moveRight:
                    {
                        var _x = position.x + steps;
                        return { x: _x >= this.model.width ? _x - this.model.width - 1 : _x,
                            y: position.y };
                    }
            }
        }
    }, {
        key: 'getCellIndex',
        value: function getCellIndex(position) {
            return position.y * this.model.width + position.x;
        }
    }, {
        key: 'perform',
        value: function perform(actions) {
            this.actionQueue.push.apply(this.actionQueue, actions);
        }
    }, {
        key: 'render',
        value: function render() {
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

            for (var y = 0; y < this.model.height; y += 1) {
                for (var x = 0; x < this.model.height; x += 1) {
                    var index = y * this.model.width + x;
                    var entity = this.model.cells[index];

                    if (entity !== GameEntity.void) {
                        var animationOffset = this.animationOffsets[index];
                        this.renderSprite(Constants.spriteInfo[entity], x, y, animationOffset);
                    }
                }
            }

            var agentSpritePosition = void 0,
                agentCloneSpritePosition = void 0;

            var _computeAgentSpritePo = this.computeAgentSpritePositions();

            var _computeAgentSpritePo2 = _slicedToArray(_computeAgentSpritePo, 2);

            agentSpritePosition = _computeAgentSpritePo2[0];
            agentCloneSpritePosition = _computeAgentSpritePo2[1];

            this.renderAgent(agentSpritePosition, agentCloneSpritePosition);

            this.animationIndex += 1;
        }
    }, {
        key: 'renderAgent',
        value: function renderAgent(position, clonePosition) {
            var sprite = Constants.agentSpriteInfo[this.currentAction || Action.stay];
            var frameOffset = this.movementIndex % sprite.frames;
            var spriteAdjustedX = sprite.x + 16 * frameOffset;

            this.context.drawImage(this.sprites, spriteAdjustedX, sprite.y, 16, 16, position.x, position.y, 16, 16);

            this.context.drawImage(this.sprites, spriteAdjustedX, sprite.y, 16, 16, clonePosition.x, clonePosition.y, 16, 16);
        }
    }, {
        key: 'renderSprite',
        value: function renderSprite(sprite, x, y, animationOffset) {
            var frameOffset = 0;

            if (sprite.frames > 0) {
                var dividedAnimationIndex = sprite.divider ? Math.floor(this.animationIndex / sprite.divider) : this.animationIndex;
                frameOffset = (dividedAnimationIndex + (animationOffset || 0)) % sprite.frames;
            }

            this.context.drawImage(this.sprites, sprite.x + 16 * frameOffset, sprite.y, 16, 16, x * 8, y * 8, 16, 16);
        }
    }, {
        key: 'resetGameState',
        value: function resetGameState() {
            this.actionQueue = [];
            this.animationIndex = 0;
            this.currentAction = null;
            this.movementIndex = 0;
            this.stats = { foodEaten: 0, poisonEaten: 0, timeSteps: 0 };

            if (this.model) {
                this.animationOffsets = this.model.cells.map(function (v) {
                    return v in Constants.spriteInfo ? Utility.getRandomIntInclusive(0, Constants.spriteInfo[v].frames - 1) : 0;
                });
            }
        }
    }, {
        key: 'setGridValue',
        value: function setGridValue(position, value) {
            var index = this.getCellIndex(position);
            var previous = this.model.cells[index];
            this.model.cells[index] = value;
            return previous;
        }
    }, {
        key: 'setModel',
        value: function setModel(model) {
            this.model = model;
            this.resetGameState();
        }
    }, {
        key: 'update',
        value: function update(currentTime) {
            if (this.model) {
                var ticks = currentTime && this.lastUpdateTime ? (currentTime - this.lastUpdateTime) / Constants.gameLoopDelayMs : 0;

                this.lastUpdateTime = currentTime;

                for (; ticks > 0; ticks -= 1) {
                    var currentAction = this.currentAction;

                    if (!currentAction) {
                        currentAction = this.currentAction = this.actionQueue.shift();
                    }

                    if (currentAction) {
                        var movementIndex = ++this.movementIndex;

                        if (currentAction !== Action.stay) {
                            if (movementIndex === 5) {
                                var dotCell = this.computeTargetCell(this.model.agent, currentAction, 1);
                                this.setGridValue(dotCell, GameEntity.void);
                            } else if (movementIndex === 8) {
                                var updatedAgentPosition = this.computeTargetCell(this.model.agent, currentAction, 2);

                                this.model.agent = updatedAgentPosition;

                                var eatenCellValue = this.setGridValue(updatedAgentPosition, GameEntity.void);

                                if (Utility.isFood(eatenCellValue)) {
                                    this.stats.foodEaten += 1;
                                } else if (Utility.isEnemy(eatenCellValue)) {
                                    this.stats.poisonEaten += 1;
                                }
                            }
                        }

                        if (movementIndex === 8) {
                            this.currentAction = null;
                            this.movementIndex = 0;
                            this.stats.timeSteps += 1;

                            if (this.stepCallback) {
                                this.stepCallback(this.stats);
                            }
                        }
                    }
                }

                this.render();
            }

            window.requestAnimationFrame(this.update.bind(this));
        }
    }]);

    return FlatlandWorld;
}();

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.World = exports.Ea = undefined;

var _viFlatlandEa = require('../../vi-flatland-ea/vi-flatland-ea');

var Ea = _interopRequireWildcard(_viFlatlandEa);

var _viFlatlandWorld = require('../../vi-flatland-world/vi-flatland-world');

var World = _interopRequireWildcard(_viFlatlandWorld);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

exports.Ea = Ea;
exports.World = World;

},{"../../vi-flatland-ea/vi-flatland-ea":1,"../../vi-flatland-world/vi-flatland-world":2}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi92aS1mbGF0bGFuZC1lYS92aS1mbGF0bGFuZC1lYS5qcyIsIi4uL3ZpLWZsYXRsYW5kLXdvcmxkL3ZpLWZsYXRsYW5kLXdvcmxkLmpzIiwic3JjL3ZpLWZsYXRsYW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7O1FDbUVnQjtRQXVDQTtRQWlFQTs7QUEzS2hCOztJQUFZOzs7O1FBQ0g7QUFFRixJQUFNLDBCQUNiO0FBQ0ksVUFBTSxDQUFOLEVBQVMsVUFBVSxDQUFWLEVBQWEsYUFBYSxDQUFiLEVBQWdCLFdBQVcsQ0FBWDtDQUY3Qjs7QUFLTixJQUFNLDRCQUNiO0FBQ0ksUUFBSSxDQUFKLEVBQU8sT0FBTyxDQUFQLEVBQVUsTUFBTSxDQUFOLEVBQVMsTUFBTSxDQUFOO0NBRmpCOztBQUtOLElBQU0sb0NBQWMsT0FBTyxNQUFQLENBQzNCO0FBQ0ksVUFBTSxDQUFOLEVBQVMsTUFBTSxDQUFOLEVBQVMsUUFBUSxDQUFSO0NBRkssQ0FBZDs7QUFLYixJQUFNLFVBQVUsT0FBTyxNQUFQLENBQWMsWUFDOUI7QUFDSSxRQUFJLFVBQVUsRUFBVixDQURSOztBQUdJLFlBQVEsa0JBQVIsR0FBNkIsVUFBUyxLQUFULEVBQWdCLENBQWhCLEVBQW1CLENBQW5CLEVBQXNCLEtBQXRCLEVBQTZCLE1BQTdCLEVBQzdCO0FBQ0ksWUFBSSxJQUFJLENBQUosRUFDSjtBQUNJLGtCQUFNLElBQUksS0FBSixHQUFZLENBQVosR0FBZ0IsQ0FBaEIsQ0FBTixHQUEyQixDQUEzQixDQURKO1NBREE7QUFJQSxZQUFJLElBQUksUUFBUSxDQUFSLEVBQ1I7QUFDSSxrQkFBTSxJQUFJLEtBQUosR0FBWSxDQUFaLEdBQWdCLENBQWhCLENBQU4sR0FBMkIsQ0FBM0IsQ0FESjtTQURBO0FBSUEsWUFBSSxJQUFJLENBQUosRUFDSjtBQUNJLGtCQUFN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LENBQTZCLEtBQUssTUFBTCxDQUFZLElBQVosQ0FBaUIsSUFBakIsQ0FBN0IsRUFsRUo7Ozs7V0F0TVM7Ozs7Ozs7Ozs7O0FDNUZiOztJQUFZOztBQUNaOztJQUFZOzs7O1FBQ0g7UUFBSSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgKiBhcyBXb3JsZCBmcm9tICcuLi92aS1mbGF0bGFuZC13b3JsZC92aS1mbGF0bGFuZC13b3JsZCc7XG5leHBvcnQgeyBXb3JsZCB9O1xuXG5leHBvcnQgY29uc3QgQWN0aW9uID1cbntcbiAgICBzdGF5OiAxLCBtb3ZlTGVmdDogMiwgbW92ZUZvcndhcmQ6IDMsIG1vdmVSaWdodDogNFxufTtcblxuZXhwb3J0IGNvbnN0IEhlYWRpbmcgPVxue1xuICAgIHVwOiAwLCByaWdodDogMSwgZG93bjogMiwgbGVmdDogM1xufTtcblxuZXhwb3J0IGNvbnN0IFdvcmxkRW50aXR5ID0gT2JqZWN0LmZyZWV6ZShcbntcbiAgICB2b2lkOiAwLCBmb29kOiAxLCBwb2lzb246IDJcbn0pO1xuXG5jb25zdCBVdGlsaXR5ID0gT2JqZWN0LmZyZWV6ZShmdW5jdGlvbigpXG57XG4gICAgbGV0IHV0aWxpdHkgPSB7fTtcblxuICAgIHV0aWxpdHkuY2xlYXJHcmlkTmVpZ2hib3JzID0gZnVuY3Rpb24oY2VsbHMsIHgsIHksIHdpZHRoLCBoZWlnaHQpXG4gICAge1xuICAgICAgICBpZiAoeCA+IDApXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNlbGxzW3kgKiB3aWR0aCArIHggLSAxXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHggPCB3aWR0aCAtIDEpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNlbGxzW3kgKiB3aWR0aCArIHggKyAxXSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgPiAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBjZWxsc1soeSAtIDEpICogd2lkdGggKyB4XSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHkgPCBoZWlnaHQgLSAxKVxuICAgICAgICB7XG4gICAgICAgICAgICBjZWxsc1soeSArIDEpICogd2lkdGggKyB4XSA9IDA7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdXRpbGl0eS5nZXRSYW5kb21JbnRJbmNsdXNpdmUgPSBmdW5jdGlvbihtaW4sIG1heClcbiAgICB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICAgIH07XG5cbiAgICB1dGlsaXR5LnNodWZmbGUgPSBmdW5jdGlvbihhcnJheSlcbiAgICB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGgsIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcblxuICAgICAgICB3aGlsZSAoY3VycmVudEluZGV4ICE9PSAwKVxuICAgICAgICB7XG4gICAgICAgICAgICByYW5kb21JbmRleCAgID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuXG4gICAgICAgICAgICB0ZW1wb3JhcnlWYWx1ZSAgICAgID0gYXJyYXlbY3VycmVudEluZGV4XTtcbiAgICAgICAgICAgIGFycmF5W2N1cnJlbnRJbmRleF0gPSBhcnJheVtyYW5kb21JbmRleF07XG4gICAgICAgICAgICBhcnJheVtyYW5kb21JbmRleF0gID0gdGVtcG9yYXJ5VmFsdWU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfTtcblxuICAgIHJldHVybiB1dGlsaXR5O1xufSgpKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUmFuZG9tV29ybGQoXG4gICAgd29ybGRXaWR0aCwgd29ybGRIZWlnaHQsIGZvb2RQcm9iYWJpbGl0eSwgcG9pc29uUHJvYmFiaWxpdHkpXG57XG4gICAgY29uc3QgbnVtV29ybGRDZWxscyAgPSB3b3JsZFdpZHRoICogd29ybGRIZWlnaHQ7XG4gICAgY29uc3QgbnVtRm9vZENlbGxzICAgPSBNYXRoLnJvdW5kKGZvb2RQcm9iYWJpbGl0eSAqIG51bVdvcmxkQ2VsbHMpO1xuICAgIGNvbnN0IG51bVBvaXNvbkNlbGxzID0gTWF0aC5yb3VuZChcbiAgICAgICAgcG9pc29uUHJvYmFiaWxpdHkgKiAobnVtV29ybGRDZWxscyAtIG51bUZvb2RDZWxscykpO1xuXG4gICAgbGV0IHdvcmxkQ2VsbHMgPSBuZXcgQXJyYXkobnVtV29ybGRDZWxscykuZmlsbChXb3JsZEVudGl0eS52b2lkKTtcblxuICAgIGxldCBhdmFpbGFibGVDZWxscyA9IFV0aWxpdHkuc2h1ZmZsZSh3b3JsZENlbGxzLm1hcCgoY3YsIGkpID0+IGkpKTtcbiAgICBjb25zdCBmb29kQ2VsbHMgICAgPSBhdmFpbGFibGVDZWxscy5zcGxpY2UoMCwgbnVtRm9vZENlbGxzKTtcbiAgICBjb25zdCBwb2lzb25DZWxscyAgPSBhdmFpbGFibGVDZWxscy5zcGxpY2UoMCwgbnVtUG9pc29uQ2VsbHMpO1xuICAgIGNvbnN0IGFnZW50Q2VsbCAgICA9IGF2YWlsYWJsZUNlbGxzLnNwbGljZSgwLCAxKVswXTtcblxuICAgIGZvciAobGV0IGZvb2RDZWxsIG9mIGZvb2RDZWxscylcbiAgICB7XG4gICAgICAgIHdvcmxkQ2VsbHNbZm9vZENlbGxdID0gV29ybGRFbnRpdHkuZm9vZDtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBwb2lzb25DZWxsIG9mIHBvaXNvbkNlbGxzKVxuICAgIHtcbiAgICAgICAgd29ybGRDZWxsc1twb2lzb25DZWxsXSA9IFdvcmxkRW50aXR5LnBvaXNvbjtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBjZWxsczogICAgICAgICAgICAgd29ybGRDZWxscyxcbiAgICAgICAgd2lkdGg6ICAgICAgICAgICAgIHdvcmxkV2lkdGgsXG4gICAgICAgIGhlaWdodDogICAgICAgICAgICB3b3JsZEhlaWdodCxcbiAgICAgICAgZm9vZFByb2JhYmlsaXR5OiAgIGZvb2RQcm9iYWJpbGl0eSxcbiAgICAgICAgcG9pc29uUHJvYmFiaWxpdHk6IHBvaXNvblByb2JhYmlsaXR5LFxuICAgICAgICBhZ2VudDoge1xuICAgICAgICAgICAgeDogICAgICAgYWdlbnRDZWxsICUgd29ybGRXaWR0aCxcbiAgICAgICAgICAgIHk6ICAgICAgIE1hdGguZmxvb3IoYWdlbnRDZWxsIC8gd29ybGRXaWR0aCksXG4gICAgICAgICAgICBoZWFkaW5nOiBVdGlsaXR5LmdldFJhbmRvbUludEluY2x1c2l2ZShIZWFkaW5nLnVwLCBIZWFkaW5nLnJpZ2h0KVxuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRHYW1lTW9kZWxGcm9tV29ybGRNb2RlbCh3b3JsZClcbntcbiAgICBjb25zdCBncmlkV2lkdGggICAgPSAyICogd29ybGQud2lkdGggLSAxO1xuICAgIGNvbnN0IGdyaWRIZWlnaHQgICA9IDIgKiB3b3JsZC5oZWlnaHQgLSAxO1xuICAgIGNvbnN0IG51bUdyaWRDZWxscyA9IGdyaWRXaWR0aCAqIGdyaWRIZWlnaHQ7XG5cbiAgICBsZXQgZ3JpZENlbGxzID0gbmV3IEFycmF5KG51bUdyaWRDZWxscykuZmlsbChXb3JsZC5HYW1lRW50aXR5LnZvaWQpO1xuXG4gICAgLy8gUGxhY2UgZG90c1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgZ3JpZEhlaWdodDsgeSArPSAxKVxuICAgIHtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBncmlkV2lkdGg7IHggKz0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgaWYgKHkgJSAyID09IDAgfHwgeCAlIDIgPT0gMClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCBpbmRleCAgICAgID0geSAqIGdyaWRXaWR0aCArIHg7XG4gICAgICAgICAgICAgICAgZ3JpZENlbGxzW2luZGV4XSA9IFdvcmxkLkdhbWVFbnRpdHkuZG90O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gUGxhY2UgZnJ1aXRzIGFuZCBlbmVtaWVzXG4gICAgZm9yIChsZXQgcm93ID0gMDsgcm93IDwgd29ybGQuaGVpZ2h0OyByb3cgKz0gMSlcbiAgICB7XG4gICAgICAgIGZvciAobGV0IGNvbHVtbiA9IDA7IGNvbHVtbiA8IHdvcmxkLndpZHRoOyBjb2x1bW4gKz0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc3Qgd29ybGRJbmRleCA9IHJvdyAqIHdvcmxkLndpZHRoICsgY29sdW1uO1xuICAgICAgICAgICAgY29uc3Qgd29ybGRWYWx1ZSA9IHdvcmxkLmNlbGxzW3dvcmxkSW5kZXhdO1xuICAgICAgICAgICAgY29uc3QgZ3JpZEluZGV4ICA9IDIgKiByb3cgKiBncmlkV2lkdGggKyAyICogY29sdW1uO1xuXG4gICAgICAgICAgICBsZXQgZ3JpZFZhbHVlID0gV29ybGQuR2FtZUVudGl0eS52b2lkO1xuXG4gICAgICAgICAgICBpZiAod29ybGRWYWx1ZSA9PT0gV29ybGRFbnRpdHkuZm9vZClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBncmlkVmFsdWUgPSBVdGlsaXR5LnNodWZmbGUoV29ybGQuQ29uc3RhbnRzLmZvb2Quc2xpY2UoKSlbMF07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh3b3JsZFZhbHVlID09PSBXb3JsZEVudGl0eS5wb2lzb24pXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZ3JpZFZhbHVlID0gVXRpbGl0eS5zaHVmZmxlKFdvcmxkLkNvbnN0YW50cy5lbmVtaWVzLnNsaWNlKCkpWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZ3JpZFZhbHVlICE9PSBXb3JsZC5HYW1lRW50aXR5LnZvaWQpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZ3JpZENlbGxzW2dyaWRJbmRleF0gPSBncmlkVmFsdWU7XG4gICAgICAgICAgICAgICAgVXRpbGl0eS5jbGVhckdyaWROZWlnaGJvcnMoXG4gICAgICAgICAgICAgICAgICAgIGdyaWRDZWxscywgMiAqIGNvbHVtbiwgMiAqIHJvdywgZ3JpZFdpZHRoLCBncmlkSGVpZ2h0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdyaWRDZWxsc1syICogd29ybGQuYWdlbnQueSAqIGdyaWRXaWR0aCArIDIgKiB3b3JsZC5hZ2VudC54XSA9IDA7XG4gICAgVXRpbGl0eS5jbGVhckdyaWROZWlnaGJvcnMoXG4gICAgICAgIGdyaWRDZWxscywgMiAqIHdvcmxkLmFnZW50LngsIDIgKiB3b3JsZC5hZ2VudC55LCBncmlkV2lkdGgsIGdyaWRIZWlnaHQpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgY2VsbHM6ICBncmlkQ2VsbHMsXG4gICAgICAgIHdpZHRoOiAgZ3JpZFdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGdyaWRIZWlnaHQsXG4gICAgICAgIGFnZW50OiB7XG4gICAgICAgICAgICB4OiB3b3JsZC5hZ2VudC54ICogMixcbiAgICAgICAgICAgIHk6IHdvcmxkLmFnZW50LnkgKiAyXG4gICAgICAgIH1cbiAgICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXZhbHVhdGVSdW4od29ybGQsIGFjdGlvbnMpXG57XG4gICAgYWN0aW9ucyA9IGFjdGlvbnMuc2xpY2UoKTtcbiAgICB3b3JsZCAgID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeSh3b3JsZCkpO1xuXG4gICAgbGV0IGZvb2RFYXRlbiA9IDAsIHBvaXNvbkVhdGVuID0gMDtcblxuICAgIHdoaWxlIChhY3Rpb25zLmxlbmd0aCA+IDApXG4gICAge1xuICAgICAgICBjb25zdCBhY3Rpb24gPSBhY3Rpb25zLnNoaWZ0KCk7XG5cbiAgICAgICAgaWYgKGFjdGlvbiAhPT0gQWN0aW9uLnN0YXkpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVMZWZ0OlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd29ybGQuYWdlbnQuaGVhZGluZyA9ICh3b3JsZC5hZ2VudC5oZWFkaW5nIC0gMSArIDQpICUgNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVSaWdodDpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmxkLmFnZW50LmhlYWRpbmcgPSAod29ybGQuYWdlbnQuaGVhZGluZyArIDEpICUgNDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzd2l0Y2ggKHdvcmxkLmFnZW50LmhlYWRpbmcpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FzZSBIZWFkaW5nLnVwOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgd29ybGQuYWdlbnQueSA9ICh3b3JsZC5hZ2VudC55IC0gMSArIHdvcmxkLmhlaWdodCkgJSB3b3JsZC5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIEhlYWRpbmcuZG93bjpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHdvcmxkLmFnZW50LnkgPSAod29ybGQuYWdlbnQueSArIDEpICUgd29ybGQuaGVpZ2h0O1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY2FzZSBIZWFkaW5nLmxlZnQ6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3b3JsZC5hZ2VudC54ID0gKHdvcmxkLmFnZW50LnggLSAxICsgd29ybGQud2lkdGgpICUgd29ybGQud2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIEhlYWRpbmcucmlnaHQ6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB3b3JsZC5hZ2VudC54ID0gKHdvcmxkLmFnZW50LnggKyAxKSAlIHdvcmxkLndpZHRoO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGVudGl0eSA9IHdvcmxkLmNlbGxzW3dvcmxkLmFnZW50LnkgKiB3b3JsZC53aWR0aCArIHdvcmxkLmFnZW50LnhdO1xuXG4gICAgICAgICAgICBzd2l0Y2ggKGVudGl0eSlcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXNlIFdvcmxkRW50aXR5LmZvb2Q6XG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmb29kRWF0ZW4gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgV29ybGRFbnRpdHkucG9pc29uOlxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcG9pc29uRWF0ZW4gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHsgZm9vZEVhdGVuOiBmb29kRWF0ZW4sIHBvaXNvbkVhdGVuOiBwb2lzb25FYXRlbiB9O1xufVxuXG4vL2Z1bmN0aW9uIHRyYW5zbGF0ZVJlbGF0aXZlQWN0aW9ucyhpbml0aWFsSGVhZGluZywgYWN0aW9ucylcbi8ve1xuLy8gICAgYWN0aW9ucyA9IGFjdGlvbnMuc2xpY2UoKTtcbi8vXG4vLyAgICB3aGlsZSAoYWN0aW9ucy5sZW5ndGggPiAwKVxuLy8gICAge1xuLy8gICAgICAgIGlmIChhY3Rpb24gXG4vLyAgICB9XG4vL1xuLy9cbi8vfVxuXG4vL2NvbnN0IHdvcmxkICA9IGdlbmVyYXRlUmFuZG9tV29ybGQoMTAsIDEwLCAxLzMsIDEvMyk7XG4vL2NvbnN0IHJlc3VsdCA9IGV2YWx1YXRlUnVuKHdvcmxkLCBuZXcgQXJyYXkoNjApLm1hcChfID0+IFV0aWxpdHkuZ2V0UmFuZG9tSW50SW5jbHVzaXZlKEFjdGlvbi5zdGF5LCBBY3Rpb24ubW92ZVJpZ2h0KSkpO1xuLy9cbi8vY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkocmVzdWx0KSk7XG5cbi8vICAgICAgIHRoaXMubW9kZWwgPSBidWlsZEdhbWVNb2RlbEZyb21Xb3JsZE1vZGVsKFxuLy8gICAgICAgICAgICBnZW5lcmF0ZVJhbmRvbVdvcmxkKG9wdGlvbnMud29ybGRXaWR0aCwgb3B0aW9ucy53b3JsZEhlaWdodCwgMS8zLCAxLzMpKTtcbiIsImV4cG9ydCBjb25zdCBBY3Rpb24gPSBPYmplY3QuZnJlZXplKFxue1xuICAgIHN0YXk6ICAgICAgMSxcbiAgICBtb3ZlVXA6ICAgIDIsXG4gICAgbW92ZURvd246ICAzLFxuICAgIG1vdmVMZWZ0OiAgNCxcbiAgICBtb3ZlUmlnaHQ6IDUsXG59KTtcblxuZXhwb3J0IGNvbnN0IEdhbWVFbnRpdHkgPSBPYmplY3QuZnJlZXplKFxue1xuICAgIHZvaWQ6ICAgICAgICAwLFxuICAgIGRvdDogICAgICAgICAxLFxuICAgIGNoZXJyeTogICAgICAyLFxuICAgIHN0cmF3YmVycnk6ICAzLFxuICAgIG9yYW5nZTogICAgICA0LFxuICAgIGFwcGxlOiAgICAgICA1LFxuICAgIG1lbG9uOiAgICAgICA2LFxuICAgIGJsaW5reTogICAgICA3LFxuICAgIHBpbmt5OiAgICAgICA4LFxuICAgIGlua3k6ICAgICAgICA5LFxuICAgIGNseWRlOiAgICAgIDEwXG59KTtcblxuZXhwb3J0IGNvbnN0IENvbnN0YW50cyA9IE9iamVjdC5mcmVlemUoZnVuY3Rpb24oKVxue1xuICAgIGxldCBjb25zdGFudHMgPSB7fTtcblxuICAgIGNvbnN0YW50cy5hbmltYXRpb25EaXZpZGVyID0gODtcbiAgICBjb25zdGFudHMuZ2FtZUxvb3BEZWxheU1zICA9IDEwMDAgLyAzMDtcblxuICAgIGNvbnN0YW50cy5mb29kID1cbiAgICBbXG4gICAgICAgIEdhbWVFbnRpdHkuY2hlcnJ5LFxuICAgICAgICBHYW1lRW50aXR5LnN0cmF3YmVycnksXG4gICAgICAgIEdhbWVFbnRpdHkub3JhbmdlLFxuICAgICAgICBHYW1lRW50aXR5LmFwcGxlLFxuICAgICAgICBHYW1lRW50aXR5Lm1lbG9uXG4gICAgXTtcblxuICAgIGNvbnN0YW50cy5lbmVtaWVzID1cbiAgICBbXG4gICAgICAgIEdhbWVFbnRpdHkuYmxpbmt5LFxuICAgICAgICBHYW1lRW50aXR5LnBpbmt5LFxuICAgICAgICBHYW1lRW50aXR5Lmlua3ksXG4gICAgICAgIEdhbWVFbnRpdHkuY2x5ZGVcbiAgICBdO1xuXG4gICAgY29uc3RhbnRzLnNwcml0ZUluZm8gICAgICAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuZG90XSAgICAgICAgPSB7IHg6IDE3NiwgeTogIDAsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuY2hlcnJ5XSAgICAgPSB7IHg6IDE5MiwgeTogIDAsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuc3RyYXdiZXJyeV0gPSB7IHg6IDE5MiwgeTogMTYsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkub3JhbmdlXSAgICAgPSB7IHg6IDE5MiwgeTogMzIsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuYXBwbGVdICAgICAgPSB7IHg6IDE5MiwgeTogNDgsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkubWVsb25dICAgICAgPSB7IHg6IDE5MiwgeTogNjQsIGZyYW1lczogMSB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuYmxpbmt5XSAgICAgPSB7IHg6IDE2MCwgeTogMTYsIGZyYW1lczogMiwgZGl2aWRlcjogOCB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkucGlua3ldICAgICAgPSB7IHg6IDE2MCwgeTogMzIsIGZyYW1lczogMiwgZGl2aWRlcjogOCB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuaW5reV0gICAgICAgPSB7IHg6IDE2MCwgeTogNDgsIGZyYW1lczogMiwgZGl2aWRlcjogOCB9O1xuICAgIGNvbnN0YW50cy5zcHJpdGVJbmZvW0dhbWVFbnRpdHkuY2x5ZGVdICAgICAgPSB7IHg6ICA2NCwgeTogNjQsIGZyYW1lczogOCwgZGl2aWRlcjogOCB9O1xuXG4gICAgY29uc3RhbnRzLmFnZW50U3ByaXRlSW5mbyAgICAgICAgICAgICAgICAgICA9IHt9O1xuICAgIGNvbnN0YW50cy5hZ2VudFNwcml0ZUluZm9bQWN0aW9uLnN0YXldICAgICAgPSB7IHg6IDAsIHk6IDE2LCBmcmFtZXM6IDEgfTtcbiAgICBjb25zdGFudHMuYWdlbnRTcHJpdGVJbmZvW0FjdGlvbi5tb3ZlVXBdICAgID0geyB4OiAwLCB5OiAxNiwgZnJhbWVzOiA0IH07XG4gICAgY29uc3RhbnRzLmFnZW50U3ByaXRlSW5mb1tBY3Rpb24ubW92ZURvd25dICA9IHsgeDogMCwgeTogMzIsIGZyYW1lczogNCB9O1xuICAgIGNvbnN0YW50cy5hZ2VudFNwcml0ZUluZm9bQWN0aW9uLm1vdmVMZWZ0XSAgPSB7IHg6IDAsIHk6IDQ4LCBmcmFtZXM6IDQgfTtcbiAgICBjb25zdGFudHMuYWdlbnRTcHJpdGVJbmZvW0FjdGlvbi5tb3ZlUmlnaHRdID0geyB4OiAwLCB5OiA2NCwgZnJhbWVzOiA0IH07XG5cbiAgICByZXR1cm4gY29uc3RhbnRzO1xufSgpKTtcblxuZXhwb3J0IGNvbnN0IFV0aWxpdHkgPSBPYmplY3QuZnJlZXplKGZ1bmN0aW9uKClcbntcbiAgICBsZXQgdXRpbGl0eSA9IHt9O1xuXG4gICAgdXRpbGl0eS5nZXRSYW5kb21JbnRJbmNsdXNpdmUgPSBmdW5jdGlvbihtaW4sIG1heClcbiAgICB7XG4gICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAobWF4IC0gbWluICsgMSkpICsgbWluO1xuICAgIH07XG5cbiAgICB1dGlsaXR5LmlzRW5lbXkgPSBmdW5jdGlvbihlbnRpdHkpXG4gICAge1xuICAgICAgICByZXR1cm4gZW50aXR5ID49IEdhbWVFbnRpdHkuYmxpbmt5ICYmIGVudGl0eSA8PSBHYW1lRW50aXR5LmNseWRlO1xuICAgIH07XG5cbiAgICB1dGlsaXR5LmlzRm9vZCA9IGZ1bmN0aW9uKGVudGl0eSlcbiAgICB7XG4gICAgICAgIHJldHVybiBlbnRpdHkgPj0gR2FtZUVudGl0eS5jaGVycnkgJiYgZW50aXR5IDw9IEdhbWVFbnRpdHkubWVsb247XG4gICAgfTtcblxuICAgIHJldHVybiB1dGlsaXR5O1xufSgpKTtcblxuZXhwb3J0IGNsYXNzIEZsYXRsYW5kV29ybGRcbntcbiAgICBjb25zdHJ1Y3RvcihvcHRpb25zKVxuICAgIHtcbiAgICAgICAgdGhpcy5zdGVwQ2FsbGJhY2sgPSBvcHRpb25zLnN0ZXBDYWxsYmFjayB8fCBudWxsO1xuICAgICAgICB0aGlzLm1vZGVsICAgICAgICA9IG9wdGlvbnMubW9kZWwgfHwgbnVsbDtcblxuICAgICAgICB0aGlzLnJlc2V0R2FtZVN0YXRlKCk7XG5cbiAgICAgICAgdGhpcy5jYW52YXMgID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob3B0aW9ucy5lbGVtZW50SWQpO1xuICAgICAgICB0aGlzLmNvbnRleHQgPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICAgICAgICB0aGlzLmNvbnRleHQuaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG4gICAgICAgIHRoaXMuY29udGV4dC5maWxsU3R5bGUgICAgICAgICAgICAgPSAnYmxhY2snO1xuXG4gICAgICAgIHRoaXMuc3ByaXRlcyAgICAgICAgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgdGhpcy5zcHJpdGVzLm9ubG9hZCA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUuYmluZCh3aW5kb3csIHRoaXMudXBkYXRlLmJpbmQodGhpcykpO1xuICAgICAgICB0aGlzLnNwcml0ZXMuc3JjICAgID0gJ3ZpLWZsYXRsYW5kLXdvcmxkLXNwcml0ZXMucG5nJztcbiAgICB9XG5cbiAgICBjb21wdXRlQWdlbnRTcHJpdGVQb3NpdGlvbnMoKVxuICAgIHtcbiAgICAgICAgbGV0IHggPSB0aGlzLm1vZGVsLmFnZW50LnggKiA4O1xuICAgICAgICBsZXQgeSA9IHRoaXMubW9kZWwuYWdlbnQueSAqIDg7XG4gICAgICAgIGxldCBjbG9uZVggPSB4LCBjbG9uZVkgPSB5O1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRBY3Rpb24gPSB0aGlzLmN1cnJlbnRBY3Rpb247XG5cbiAgICAgICAgaWYgKGN1cnJlbnRBY3Rpb24gJiYgY3VycmVudEFjdGlvbiAhPT0gQWN0aW9uLnN0YXlQdXQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGNvbnN0IG1vdmVtZW50T2Zmc2V0ID0gMiAqIHRoaXMubW92ZW1lbnRJbmRleDtcblxuICAgICAgICAgICAgc3dpdGNoIChjdXJyZW50QWN0aW9uKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVVcDpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHkgLT0gbW92ZW1lbnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lWSA9IHkgPCAwID8geSArIDggKiAodGhpcy5tb2RlbC5oZWlnaHQgKyAxKSA6IHk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIEFjdGlvbi5tb3ZlRG93bjpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHkgKz0gbW92ZW1lbnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lWSA9ICh5ID49IDggKiAodGhpcy5tb2RlbC5oZWlnaHQgLSAxKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyB5IC0gOCAqICh0aGlzLm1vZGVsLmhlaWdodCArIDEpIDogeSk7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjYXNlIEFjdGlvbi5tb3ZlTGVmdDpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHggLT0gbW92ZW1lbnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lWCA9IHggPCAwID8geCArIDggKiAodGhpcy5tb2RlbC53aWR0aCArIDEpIDogeDtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVSaWdodDpcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHggKz0gbW92ZW1lbnRPZmZzZXQ7XG4gICAgICAgICAgICAgICAgICAgIGNsb25lWCA9ICh4ID49IDggKiAodGhpcy5tb2RlbC53aWR0aCAtIDEpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHggLSA4ICogKHRoaXMubW9kZWwud2lkdGggKyAxKSA6IHgpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gWyB7IHg6IHgsIHk6IHkgfSwgeyB4OiBjbG9uZVgsIHk6IGNsb25lWSB9IF07XG4gICAgfVxuXG4gICAgY29tcHV0ZVRhcmdldENlbGwocG9zaXRpb24sIGFjdGlvbiwgc3RlcHMpXG4gICAge1xuICAgICAgICBzd2l0Y2ggKGFjdGlvbilcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBBY3Rpb24uc3RheVB1dDpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYXNlIEFjdGlvbi5tb3ZlVXA6XG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc3QgeSA9IHBvc2l0aW9uLnkgLSBzdGVwcztcbiAgICAgICAgICAgICAgICByZXR1cm4geyB4OiBwb3NpdGlvbi54LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHkgPCAwID8geSArIHRoaXMubW9kZWwuaGVpZ2h0ICsgMSA6IHkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVEb3duOlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IHkgPSBwb3NpdGlvbi55ICsgc3RlcHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgeDogcG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiB5ID49IHRoaXMubW9kZWwuaGVpZ2h0ID8geSAtIHRoaXMubW9kZWwuaGVpZ2h0IC0gMSA6IHkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVMZWZ0OlxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBwb3NpdGlvbi54IC0gc3RlcHM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgeDogeCA8IDAgPyB4ICsgdGhpcy5tb2RlbC53aWR0aCArIDEgOiB4LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHk6IHBvc2l0aW9uLnkgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhc2UgQWN0aW9uLm1vdmVSaWdodDpcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb25zdCB4ID0gcG9zaXRpb24ueCArIHN0ZXBzO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHg6IHggPj0gdGhpcy5tb2RlbC53aWR0aCA/IHggLSB0aGlzLm1vZGVsLndpZHRoIC0gMTogeCxcbiAgICAgICAgICAgICAgICAgICAgICAgICB5OiBwb3NpdGlvbi55IH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRDZWxsSW5kZXgocG9zaXRpb24pXG4gICAge1xuICAgICAgICByZXR1cm4gcG9zaXRpb24ueSAqIHRoaXMubW9kZWwud2lkdGggKyBwb3NpdGlvbi54O1xuICAgIH1cblxuICAgIHBlcmZvcm0oYWN0aW9ucylcbiAgICB7XG4gICAgICAgIHRoaXMuYWN0aW9uUXVldWUucHVzaC5hcHBseSh0aGlzLmFjdGlvblF1ZXVlLCBhY3Rpb25zKTtcbiAgICB9XG5cbiAgICByZW5kZXIoKVxuICAgIHtcbiAgICAgICAgdGhpcy5jb250ZXh0LmZpbGxSZWN0KDAsIDAsIHRoaXMuY2FudmFzLndpZHRoLCB0aGlzLmNhbnZhcy5oZWlnaHQpO1xuXG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgdGhpcy5tb2RlbC5oZWlnaHQ7IHkgKz0gMSlcbiAgICAgICAge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB0aGlzLm1vZGVsLmhlaWdodDsgeCArPSAxKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvbnN0IGluZGV4ICA9IHkgKiB0aGlzLm1vZGVsLndpZHRoICsgeDtcbiAgICAgICAgICAgICAgICBjb25zdCBlbnRpdHkgPSB0aGlzLm1vZGVsLmNlbGxzW2luZGV4XTtcblxuICAgICAgICAgICAgICAgIGlmIChlbnRpdHkgIT09IEdhbWVFbnRpdHkudm9pZClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGFuaW1hdGlvbk9mZnNldCA9IHRoaXMuYW5pbWF0aW9uT2Zmc2V0c1tpbmRleF07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyU3ByaXRlKENvbnN0YW50cy5zcHJpdGVJbmZvW2VudGl0eV0sIHgsIHksIGFuaW1hdGlvbk9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGFnZW50U3ByaXRlUG9zaXRpb24sIGFnZW50Q2xvbmVTcHJpdGVQb3NpdGlvbjtcbiAgICAgICAgW2FnZW50U3ByaXRlUG9zaXRpb24sIGFnZW50Q2xvbmVTcHJpdGVQb3NpdGlvbl0gPSB0aGlzLmNvbXB1dGVBZ2VudFNwcml0ZVBvc2l0aW9ucygpO1xuICAgICAgICB0aGlzLnJlbmRlckFnZW50KGFnZW50U3ByaXRlUG9zaXRpb24sIGFnZW50Q2xvbmVTcHJpdGVQb3NpdGlvbik7XG5cbiAgICAgICAgdGhpcy5hbmltYXRpb25JbmRleCArPSAxO1xuICAgIH1cblxuICAgIHJlbmRlckFnZW50KHBvc2l0aW9uLCBjbG9uZVBvc2l0aW9uKVxuICAgIHtcbiAgICAgICAgY29uc3Qgc3ByaXRlICAgICAgICAgID0gQ29uc3RhbnRzLmFnZW50U3ByaXRlSW5mb1t0aGlzLmN1cnJlbnRBY3Rpb24gfHwgQWN0aW9uLnN0YXldO1xuICAgICAgICBjb25zdCBmcmFtZU9mZnNldCAgICAgPSB0aGlzLm1vdmVtZW50SW5kZXggJSBzcHJpdGUuZnJhbWVzO1xuICAgICAgICBjb25zdCBzcHJpdGVBZGp1c3RlZFggPSBzcHJpdGUueCArIDE2ICogZnJhbWVPZmZzZXQ7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNwcml0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlQWRqdXN0ZWRYLCBzcHJpdGUueSwgMTYsIDE2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uLngsIHBvc2l0aW9uLnksIDE2LCAxNik7XG5cbiAgICAgICAgdGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLnNwcml0ZXMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3ByaXRlQWRqdXN0ZWRYLCBzcHJpdGUueSwgMTYsIDE2LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lUG9zaXRpb24ueCwgY2xvbmVQb3NpdGlvbi55LCAxNiwgMTYpO1xuICAgIH1cblxuICAgIHJlbmRlclNwcml0ZShzcHJpdGUsIHgsIHksIGFuaW1hdGlvbk9mZnNldClcbiAgICB7XG4gICAgICAgIGxldCBmcmFtZU9mZnNldCA9IDA7XG5cbiAgICAgICAgaWYgKHNwcml0ZS5mcmFtZXMgPiAwKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zdCBkaXZpZGVkQW5pbWF0aW9uSW5kZXggPSBzcHJpdGUuZGl2aWRlciA/IE1hdGguZmxvb3IodGhpcy5hbmltYXRpb25JbmRleCAvIHNwcml0ZS5kaXZpZGVyKSA6IHRoaXMuYW5pbWF0aW9uSW5kZXg7XG4gICAgICAgICAgICBmcmFtZU9mZnNldCA9IChkaXZpZGVkQW5pbWF0aW9uSW5kZXggKyAoYW5pbWF0aW9uT2Zmc2V0IHx8IDApKSAlIHNwcml0ZS5mcmFtZXM7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbnRleHQuZHJhd0ltYWdlKHRoaXMuc3ByaXRlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcHJpdGUueCArIDE2ICogZnJhbWVPZmZzZXQsIHNwcml0ZS55LCAxNiwgMTYsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeCAqIDgsIHkgKiA4LCAxNiwgMTYpO1xuICAgIH1cblxuICAgIHJlc2V0R2FtZVN0YXRlKClcbiAgICB7XG4gICAgICAgIHRoaXMuYWN0aW9uUXVldWUgICAgPSBbXTtcbiAgICAgICAgdGhpcy5hbmltYXRpb25JbmRleCA9IDA7XG4gICAgICAgIHRoaXMuY3VycmVudEFjdGlvbiAgPSBudWxsO1xuICAgICAgICB0aGlzLm1vdmVtZW50SW5kZXggID0gMDtcbiAgICAgICAgdGhpcy5zdGF0cyAgICAgICAgICA9IHsgZm9vZEVhdGVuOiAwLCBwb2lzb25FYXRlbjogMCwgdGltZVN0ZXBzOiAwIH07XG5cbiAgICAgICAgaWYgKHRoaXMubW9kZWwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0aW9uT2Zmc2V0cyA9IHRoaXMubW9kZWwuY2VsbHMubWFwKFxuICAgICAgICAgICAgICAgIHYgPT4gdiBpbiBDb25zdGFudHMuc3ByaXRlSW5mb1xuICAgICAgICAgICAgICAgICAgICAgPyBVdGlsaXR5LmdldFJhbmRvbUludEluY2x1c2l2ZSgwLCBDb25zdGFudHMuc3ByaXRlSW5mb1t2XS5mcmFtZXMgLSAxKVxuICAgICAgICAgICAgICAgICAgICAgOiAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldEdyaWRWYWx1ZShwb3NpdGlvbiwgdmFsdWUpXG4gICAge1xuICAgICAgICBjb25zdCBpbmRleCAgICA9IHRoaXMuZ2V0Q2VsbEluZGV4KHBvc2l0aW9uKTtcbiAgICAgICAgY29uc3QgcHJldmlvdXMgPSB0aGlzLm1vZGVsLmNlbGxzW2luZGV4XTtcbiAgICAgICAgdGhpcy5tb2RlbC5jZWxsc1tpbmRleF0gPSB2YWx1ZTtcbiAgICAgICAgcmV0dXJuIHByZXZpb3VzO1xuICAgIH1cblxuICAgIHNldE1vZGVsKG1vZGVsKVxuICAgIHtcbiAgICAgICAgdGhpcy5tb2RlbCA9IG1vZGVsO1xuICAgICAgICB0aGlzLnJlc2V0R2FtZVN0YXRlKCk7XG4gICAgfVxuXG4gICAgdXBkYXRlKGN1cnJlbnRUaW1lKVxuICAgIHtcbiAgICAgICAgaWYgKHRoaXMubW9kZWwpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGxldCB0aWNrcyA9IChjdXJyZW50VGltZSAmJiB0aGlzLmxhc3RVcGRhdGVUaW1lXG4gICAgICAgICAgICAgICAgICAgICAgPyAoY3VycmVudFRpbWUgLSB0aGlzLmxhc3RVcGRhdGVUaW1lKSAvIENvbnN0YW50cy5nYW1lTG9vcERlbGF5TXMgOiAwKTtcblxuICAgICAgICAgICAgdGhpcy5sYXN0VXBkYXRlVGltZSA9IGN1cnJlbnRUaW1lO1xuXG4gICAgICAgICAgICBmb3IgKDsgdGlja3MgPiAwOyB0aWNrcyAtPSAxKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50QWN0aW9uID0gdGhpcy5jdXJyZW50QWN0aW9uO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50QWN0aW9uKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEFjdGlvbiA9IHRoaXMuY3VycmVudEFjdGlvbiA9IHRoaXMuYWN0aW9uUXVldWUuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudEFjdGlvbilcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1vdmVtZW50SW5kZXggPSArK3RoaXMubW92ZW1lbnRJbmRleDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY3VycmVudEFjdGlvbiAhPT0gQWN0aW9uLnN0YXkpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlbWVudEluZGV4ID09PSA1KVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvdENlbGwgPSB0aGlzLmNvbXB1dGVUYXJnZXRDZWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1vZGVsLmFnZW50LCBjdXJyZW50QWN0aW9uLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEdyaWRWYWx1ZShkb3RDZWxsLCBHYW1lRW50aXR5LnZvaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAobW92ZW1lbnRJbmRleCA9PT0gOClcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB1cGRhdGVkQWdlbnRQb3NpdGlvbiA9IHRoaXMuY29tcHV0ZVRhcmdldENlbGwoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubW9kZWwuYWdlbnQsIGN1cnJlbnRBY3Rpb24sIDIpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb2RlbC5hZ2VudCA9IHVwZGF0ZWRBZ2VudFBvc2l0aW9uO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVhdGVuQ2VsbFZhbHVlID0gdGhpcy5zZXRHcmlkVmFsdWUodXBkYXRlZEFnZW50UG9zaXRpb24sIEdhbWVFbnRpdHkudm9pZCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoVXRpbGl0eS5pc0Zvb2QoZWF0ZW5DZWxsVmFsdWUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0cy5mb29kRWF0ZW4gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoVXRpbGl0eS5pc0VuZW15KGVhdGVuQ2VsbFZhbHVlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhdHMucG9pc29uRWF0ZW4gKz0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZW1lbnRJbmRleCA9PT0gOClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50QWN0aW9uICAgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tb3ZlbWVudEluZGV4ICAgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGF0cy50aW1lU3RlcHMgKz0gMTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RlcENhbGxiYWNrKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RlcENhbGxiYWNrKHRoaXMuc3RhdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9XG5cbiAgICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBFYSBmcm9tICcuLi8uLi92aS1mbGF0bGFuZC1lYS92aS1mbGF0bGFuZC1lYSc7XG5pbXBvcnQgKiBhcyBXb3JsZCBmcm9tICcuLi8uLi92aS1mbGF0bGFuZC13b3JsZC92aS1mbGF0bGFuZC13b3JsZCc7XG5leHBvcnQgeyBFYSwgV29ybGQgfTtcbiJdfQ==
