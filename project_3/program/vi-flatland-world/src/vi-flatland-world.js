export const Action = Object.freeze(
{
    stay:      1,
    moveUp:    2,
    moveDown:  3,
    moveLeft:  4,
    moveRight: 5,
});

export const GameEntity = Object.freeze(
{
    void:        0,
    dot:         1,
    cherry:      2,
    strawberry:  3,
    orange:      4,
    apple:       5,
    melon:       6,
    blinky:      7,
    pinky:       8,
    inky:        9,
    clyde:      10
});

export const WorldEntity = Object.freeze(
{
    void: 0, food: 1, poison: 2
});

const Constants = Object.freeze(function()
{
    let constants = {};

    constants.animationDivider = 8;
    constants.gameLoopDelayMs  = 1000 / 30;

    constants.food =
    [
        GameEntity.cherry,
        GameEntity.strawberry,
        GameEntity.orange,
        GameEntity.apple,
        GameEntity.melon
    ];

    constants.enemies =
    [
        GameEntity.blinky,
        GameEntity.pinky,
        GameEntity.inky,
        GameEntity.clyde
    ];

    constants.spriteInfo                        = {};
    constants.spriteInfo[GameEntity.dot]        = { x: 176, y: 0, frames: 1 };
    constants.spriteInfo[GameEntity.cherry]     = { x: 192, y: 0, frames: 1 };
    constants.spriteInfo[GameEntity.strawberry] = { x: 192, y: 16, frames: 1 };
    constants.spriteInfo[GameEntity.orange]     = { x: 192, y: 32, frames: 1 };
    constants.spriteInfo[GameEntity.apple]      = { x: 192, y: 48, frames: 1 };
    constants.spriteInfo[GameEntity.melon]      = { x: 192, y: 64, frames: 1 };
    constants.spriteInfo[GameEntity.blinky]     = { x: 160, y: 16, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.pinky]      = { x: 160, y: 32, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.inky]       = { x: 160, y: 48, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.clyde]      = { x:  64, y: 64, frames: 8, divider: 8 };

    constants.agentSpriteInfo                   = {};
    constants.agentSpriteInfo[Action.stay]      = { x: 0, y: 16, frames: 1 };
    constants.agentSpriteInfo[Action.moveUp]    = { x: 0, y: 16, frames: 4 };
    constants.agentSpriteInfo[Action.moveDown]  = { x: 0, y: 32, frames: 4 };
    constants.agentSpriteInfo[Action.moveLeft]  = { x: 0, y: 48, frames: 4 };
    constants.agentSpriteInfo[Action.moveRight] = { x: 0, y: 64, frames: 4 };

    return constants;
}());

const Utility = Object.freeze(function()
{
    let utility = {};

    utility.clearGridNeighbors = function(cells, x, y, width, height)
    {
        if (x > 0)
        {
            cells[y * width + x - 1] = 0;
        }
        if (x < width - 1)
        {
            cells[y * width + x + 1] = 0;
        }
        if (y > 0)
        {
            cells[(y - 1) * width + x] = 0;
        }
        if (y < height - 1)
        {
            cells[(y + 1) * width + x] = 0;
        }
    };

    utility.getRandomIntInclusive = function(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    utility.isEnemy = function(entity)
    {
        return entity >= GameEntity.blinky && entity <= GameEntity.clyde;
    };

    utility.isFood = function(entity)
    {
        return entity >= GameEntity.cherry && entity <= GameEntity.melon;
    };

    utility.shuffle = function(array)
    {
        var currentIndex = array.length, temporaryValue, randomIndex;

        while (currentIndex !== 0)
        {
            randomIndex   = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue      = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex]  = temporaryValue;
        }

        return array;
    };

    return utility;
}());

export function generateRandomWorld(
    worldWidth, worldHeight, foodProbability, poisonProbability)
{
    const numWorldCells  = worldWidth * worldHeight;
    const numFoodCells   = Math.round(foodProbability * numWorldCells);
    const numPoisonCells = Math.round(
        poisonProbability * (numWorldCells - numFoodCells));

    let worldCells = new Array(numWorldCells).fill(WorldEntity.void);

    let availableCells = Utility.shuffle(worldCells.map((cv, i) => i));
    const foodCells    = availableCells.splice(0, numFoodCells);
    const poisonCells  = availableCells.splice(0, numPoisonCells);
    const agentCell    = availableCells.splice(0, 1)[0];

    for (let foodCell of foodCells)
    {
        worldCells[foodCell] = WorldEntity.food;
    }

    for (let poisonCell of poisonCells)
    {
        worldCells[poisonCell] = WorldEntity.poison;
    }

    return {
        cells:             worldCells,
        width:             worldWidth,
        height:            worldHeight,
        foodProbability:   foodProbability,
        poisonProbability: poisonProbability,
        agent:             { x: agentCell % worldWidth, y: Math.floor(agentCell / worldWidth) }
    }
}

export function buildGameModelFromWorldModel(world)
{
    const gridWidth    = 2 * world.width - 1;
    const gridHeight   = 2 * world.height - 1;
    const numGridCells = gridWidth * gridHeight;

    let gridCells = new Array(numGridCells).fill(GameEntity.void);

    // Place dots
    for (let y = 0; y < gridHeight; y += 1)
    {
        for (let x = 0; x < gridWidth; x += 1)
        {
            if (y % 2 == 0 || x % 2 == 0)
            {
                const index = y * gridWidth + x;
                gridCells[index] = GameEntity.dot;
            }
        }
    }

    // Place fruits and enemies
    for (let row = 0; row < world.height; row += 1)
    {
        for (let column = 0; column < world.width; column += 1)
        {
            const worldIndex = row * world.width + column;
            const worldValue = world.cells[worldIndex];
            const gridIndex  = 2 * row * gridWidth + 2 * column;

            let gridValue = GameEntity.void;

            if (worldValue === WorldEntity.food)
            {
                gridValue = Utility.shuffle(Constants.food.slice())[0];
            }
            else if (worldValue === WorldEntity.poison)
            {
                gridValue = Utility.shuffle(Constants.enemies.slice())[0];
            }

            if (gridValue !== GameEntity.void)
            {
                gridCells[gridIndex] = gridValue;
                Utility.clearGridNeighbors(
                    gridCells, 2 * column, 2 * row, gridWidth, gridHeight);
            }
        }
    }

    gridCells[2 * world.agent.y * gridWidth + 2 * world.agent.x] = 0;
    Utility.clearGridNeighbors(
        gridCells, 2 * world.agent.x, 2 * world.agent.y, gridWidth, gridHeight);

    return {
        cells:  gridCells,
        width:  gridWidth,
        height: gridHeight,
        agent: {
            x: world.agent.x * 2,
            y: world.agent.y * 2
        }
    };
}

export class Flatland
{
    constructor(options)
    {
        this.stepCallback = options.stepCallback || null;

        this.model = buildGameModelFromWorldModel(
            generateRandomWorld(options.worldWidth, options.worldHeight, 1/3, 1/3));

        this.animationOffsets = this.model.cells.map(
            v => Utility.isEnemy(v) ? Utility.getRandomIntInclusive(0, 1) : null);

        this.resetGameState();

        this.canvas  = document.getElementById(options.elementId);
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle             = 'black';

        this.sprites        = new Image();
        this.sprites.onload = window.requestAnimationFrame.bind(window, this.update.bind(this));
        this.sprites.src    = 'sprites.png';
    }

    computeAgentSpritePositions()
    {
        let x = this.model.agent.x * 8;
        let y = this.model.agent.y * 8;
        let cloneX = x, cloneY = y;

        const currentAction = this.currentAction;

        if (currentAction && currentAction !== Action.stayPut)
        {
            const movementOffset = 2 * this.movementIndex;

            switch (currentAction)
            {
                case Action.moveUp:
                {
                    y -= movementOffset;
                    cloneY = y < 0 ? y + 8 * (this.model.height + 1) : y;
                    break;
                }
                case Action.moveDown:
                {
                    y += movementOffset;
                    cloneY = (y >= 8 * (this.model.height - 1)
                        ? y - 8 * (this.model.height + 1) : y);
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
                    cloneX = (x >= 8 * (this.model.width - 1)
                        ? x - 8 * (this.model.width + 1) : x);
                    break;
                }
            }
        }

        return [ { x: x, y: y }, { x: cloneX, y: cloneY } ];
    }

    computeTargetCell(position, action, steps)
    {
        switch (action)
        {
            case Action.stayPut:
            {
                return position;
            }
            case Action.moveUp:
            {
                const y = position.y - steps;
                return { x: position.x,
                         y: y < 0 ? y + this.model.height + 1 : y };
            }
            case Action.moveDown:
            {
                const y = position.y + steps;
                return { x: position.x,
                         y: y >= this.model.height ? y - this.model.height - 1 : y };
            }
            case Action.moveLeft:
            {
                const x = position.x - steps;
                return { x: x < 0 ? x + this.model.width + 1 : x,
                         y: position.y };
            }
            case Action.moveRight:
            {
                const x = position.x + steps;
                return { x: x >= this.model.width ? x - this.model.width - 1: x,
                         y: position.y };
            }
        }
    }

    getCellIndex(position)
    {
        return position.y * this.model.width + position.x;
    }

    perform(actions)
    {
        this.actionQueue.push.apply(this.actionQueue, actions);
    }

    render()
    {
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.model.height; y += 1)
        {
            for (let x = 0; x < this.model.height; x += 1)
            {
                const index  = y * this.model.width + x;
                const entity = this.model.cells[index];

                if (entity !== GameEntity.void)
                {
                    const animationOffset = this.animationOffsets[index];
                    this.renderSprite(Constants.spriteInfo[entity], x, y, animationOffset);
                }
            }
        }

        let agentSpritePosition, agentCloneSpritePosition;
        [agentSpritePosition, agentCloneSpritePosition] = this.computeAgentSpritePositions();
        this.renderAgent(agentSpritePosition, agentCloneSpritePosition);

        this.animationIndex += 1;
    }

    renderAgent(position, clonePosition)
    {
        const sprite          = Constants.agentSpriteInfo[this.currentAction || Action.stay];
        const frameOffset     = this.movementIndex % sprite.frames;
        const spriteAdjustedX = sprite.x + 16 * frameOffset;

        this.context.drawImage(this.sprites,
                               spriteAdjustedX, sprite.y, 16, 16,
                               position.x, position.y, 16, 16);

        this.context.drawImage(this.sprites,
                               spriteAdjustedX, sprite.y, 16, 16,
                               clonePosition.x, clonePosition.y, 16, 16);
    }

    renderSprite(sprite, x, y, animationOffset)
    {
        let frameOffset = 0;

        if (sprite.frames > 0)
        {
            const dividedAnimationIndex = sprite.divider ? Math.floor(this.animationIndex / sprite.divider) : this.animationIndex;
            frameOffset = (dividedAnimationIndex + (animationOffset || 0)) % sprite.frames;
        }

        this.context.drawImage(this.sprites,
                               sprite.x + 16 * frameOffset, sprite.y, 16, 16,
                               x * 8, y * 8, 16, 16);
    }

    resetGameState()
    {
        this.currentAction = null;
        this.stats         = { foodEaten: 0, poisonEaten: 0, timeSteps: 0 };
        this.animationIndex = 0;
        this.actionQueue = [];
        this.movementIndex = 0;
    }

    setGridValue(position, value)
    {
        const index    = this.getCellIndex(position);
        const previous = this.model.cells[index];
        this.model.cells[index] = value;
        return previous;
    }

    setModel(model)
    {
        this.model = model;
        resetGameState();
    }

    update(currentTime)
    {
        let ticks = (currentTime && this.lastUpdateTime
                  ? (currentTime - this.lastUpdateTime) / Constants.gameLoopDelayMs : 0);

        this.lastUpdateTime = currentTime;

        for (; ticks > 0; ticks -= 1)
        {
            let currentAction = this.currentAction;

            if (!currentAction)
            {
                currentAction = this.currentAction = this.actionQueue.shift();
            }

            if (currentAction)
            {
                const movementIndex = ++this.movementIndex;

                if (currentAction !== Action.stayPut)
                {
                    if (movementIndex === 5)
                    {
                        const dotCell = this.computeTargetCell(
                            this.model.agent, currentAction, 1);
                        this.setGridValue(dotCell, GameEntity.void);
                    }
                    else if (movementIndex === 8)
                    {
                        const updatedAgentPosition = this.computeTargetCell(
                            this.model.agent, currentAction, 2);

                        this.model.agent = updatedAgentPosition;

                        let eatenCellValue = this.setGridValue(updatedAgentPosition, GameEntity.void);

                        if (Utility.isFood(eatenCellValue))
                        {
                            this.stats.foodEaten += 1;
                        }
                        else if (Utility.isEnemy(eatenCellValue))
                        {
                            this.stats.poisonEaten += 1;
                        }
                    }
                }

                if (movementIndex === 8)
                {
                    this.currentAction   = null;
                    this.movementIndex   = 0;
                    this.stats.timeSteps += 1;

                    if (this.stepCallback)
                    {
                        this.stepCallback(this.stats);
                    }
                }
            }
        }

        this.render();
        window.requestAnimationFrame(this.update.bind(this));
    }
}
