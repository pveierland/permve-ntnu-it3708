const Action =
{
    none: 0, up: 1, down: 2, left: 3, right: 4
};

const GameEntity =
{
    void:        0,
    agent:       1,
    dot:         2,
    cherry:      3,
    strawberry:  4,
    orange:      5,
    apple:       6,
    melon:       7,
    blinky:      8,
    pinky:       9,
    inky:       10,
    clyde:      11
};

const WorldEntity =
{
    void: 0, food: 1, poison: 2
};

var Constants =
{
    animationDivider: 8,
    gameLoopDelayMs: 1000 / 30
};

Constants.food =
[
    GameEntity.cherry,
    GameEntity.strawberry,
    GameEntity.orange,
    GameEntity.apple,
    GameEntity.melon
];

Constants.enemies =
[
    GameEntity.blinky,
    GameEntity.pinky,
    GameEntity.inky,
    GameEntity.clyde
];

Constants.spriteOffsets = {};

Constants.spriteOffsets[GameEntity.agent] = [
    [ { x: 0, y: 16 } ],
    [ { x: 0, y: 16 }, { x: 16, y: 16 }, { x: 32, y: 16 }, { x: 48, y: 16 } ],
    [ { x: 0, y: 32 }, { x: 16, y: 32 }, { x: 32, y: 32 }, { x: 48, y: 32 } ],
    [ { x: 0, y: 48 }, { x: 16, y: 48 }, { x: 32, y: 48 }, { x: 48, y: 48 } ],
    [ { x: 0, y: 64 }, { x: 16, y: 64 }, { x: 32, y: 64 }, { x: 48, y: 64 } ] ];

Constants.spriteOffsets[GameEntity.dot]        = { x: 176, y:  0 };
Constants.spriteOffsets[GameEntity.cherry]     = { x: 192, y:  0 };
Constants.spriteOffsets[GameEntity.strawberry] = { x: 192, y: 16 };
Constants.spriteOffsets[GameEntity.orange]     = { x: 192, y: 32 };
Constants.spriteOffsets[GameEntity.apple]      = { x: 192, y: 48 };
Constants.spriteOffsets[GameEntity.melon]      = { x: 192, y: 64 };

Constants.spriteOffsets[GameEntity.blinky]     = { x:  160, y: 16 };
Constants.spriteOffsets[GameEntity.pinky]      = { x:  160, y: 32 };
Constants.spriteOffsets[GameEntity.inky]       = { x:  160, y: 48 };
Constants.spriteOffsets[GameEntity.clyde]      = { x:  160, y: 64 };

var Utility = {};

Utility.getRandomIntInclusive = function(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

Utility.isEnemy = function(entity)
{
    return entity >= GameEntity.blinky && entity <= GameEntity.clyde;
};

Utility.isFood = function(entity)
{
    return entity >= GameEntity.cherry && entity <= GameEntity.melon;
};

Utility.shuffle = function(array)
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

function clearGridNeighbors(cells, x, y, width, height)
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
}

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
                clearGridNeighbors(gridCells, 2 * column, 2 * row, gridWidth, gridHeight);
            }
        }
    }

    gridCells[2 * world.agent.y * gridWidth + 2 * world.agent.x] = 0;
    clearGridNeighbors(gridCells, 2 * world.agent.x, 2 * world.agent.y, gridWidth, gridHeight);

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
        this.canvas  = document.getElementById(options.elementId);
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;

        this.model = buildGameModelFromWorldModel(
            generateRandomWorld(options.worldWidth, options.worldHeight, 1/3, 1/3));

        this.animationOffsets = this.model.cells.map(
            v => Utility.isEnemy(v) ? Utility.getRandomIntInclusive(0, 1) : null);

        this.animationIndex = 0;
        this.actionQueue = [];
        this.movementIndex = 0;

        this.remainingTimeSteps = options.timeSteps || 10;

        this.sprites        = new Image();
        this.sprites.onload = window.requestAnimationFrame.bind(window, this.update.bind(this));
        this.sprites.src    = 'sprites.png';

        this.animationSkipCounter = 0;

        this.currentAction = null;

        this.context.fillStyle = 'black';

        this.stats = { foodEaten: 0, poisonEaten: 0, timeSteps: 0 };
    }

    computeAgentSpritePositions()
    {
        let x = this.model.agent.x * 8;
        let y = this.model.agent.y * 8;
        let cloneX = x, cloneY = y;

        const currentAction = this.currentAction;

        if (currentAction && currentAction !== Action.none)
        {
            const movementOffset = 2 * this.movementIndex;

            switch (currentAction)
            {
                case Action.up:
                {
                    y -= movementOffset;
                    cloneY = y < 0 ? y + 8 * (this.model.height + 1) : y;
                    break;
                }
                case Action.down:
                {
                    y += movementOffset;
                    cloneY  = y >= 8 * (this.model.height - 1) ? y - 8 * (this.model.height + 1) : y;
                    break;
                }
                case Action.left:
                {
                    x -= movementOffset;
                    cloneX = x < 0 ? x + 8 * (this.model.width + 1) : x;
                    break;
                }
                case Action.right:
                {
                    x  += movementOffset;
                    cloneX  = x >= 8 * (this.model.width - 1) ? x - 8 * (this.model.width + 1) : x;
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
            case Action.none:
            {
                return position;
            }
            case Action.up:
            {
                const y = position.y - steps;
                return { x: position.x, y: y < 0 ? y + this.model.height + 1 : y };
            }
            case Action.down:
            {
                const y = position.y + steps;
                return { x: position.x, y: y >= this.model.height ? y - this.model.height - 1 : y };
            }
            case Action.left:
            {
                const x = position.x - steps;
                return { x: x < 0 ? x + this.model.width + 1 : x, y: position.y };
            }
            case Action.right:
            {
                const x = position.x + steps;
                return { x: x >= this.model.width ? x - this.model.width - 1: x, y: position.y };
            }
        }
    }

    getCellIndex(position)
    {
        return position.y * this.model.width + position.x;
    }

    move(direction)
    {
        this.actionQueue.push(direction)
    }

    render()
    {
        const currentAction = this.currentAction;
        const movementIndex = this.movementIndex;
        const animationIndex = this.animationIndex;

        this.context.fillStyle = 'black';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.model.height; y += 1)
        {
            for (let x = 0; x < this.model.height; x += 1)
            {
                const index = y * this.model.width + x;
                const value = this.model.cells[index];

                if (value !== GameEntity.void)
                {
                    const spriteOffset    = Constants.spriteOffsets[value];
                    const animationOffset = this.animationOffsets[index];

                    const spriteAnimationOffset =
                        animationOffset ? 16 * ((animationIndex + animationOffset) % 2) : 0;

                    this.context.drawImage(
                        this.sprites,
                        spriteOffset.x + spriteAnimationOffset, spriteOffset.y, 16, 16,
                        8 * x, 8 * y, 16, 16);
                }
            }
        }

        if (this.animationSkipCounter == 0)
        {
            this.animationIndex = this.animationIndex == 1 ? 0 : this.animationIndex + 1;
        }

        this.animationSkipCounter = (
            this.animationSkipCounter < Constants.animationDivider - 1
            ? this.animationSkipCounter + 1 : 0);

        let agentSpritePosition, agentCloneSpritePosition;
        [agentSpritePosition, agentCloneSpritePosition] = this.computeAgentSpritePositions();

        const agentSpriteOffset = Constants.spriteOffsets[GameEntity.agent][currentAction || 0][movementIndex % 4];

        this.context.drawImage(this.sprites,
                               agentSpriteOffset.x, agentSpriteOffset.y, 16, 16,
                               agentSpritePosition.x, agentSpritePosition.y, 16, 16);

        this.context.drawImage(this.sprites,
                               agentSpriteOffset.x, agentSpriteOffset.y, 16, 16,
                               agentCloneSpritePosition.x, agentCloneSpritePosition.y, 16, 16);
    }

    setGridValue(position, value)
    {
        this.model.cells[this.getCellIndex(position)] = value;
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

                switch (movementIndex)
                {
                    case 5:
                    {
                        const dotCell = this.computeTargetCell(
                            this.model.agent, currentAction, 1);
                        this.setGridValue(dotCell, 0);
                        break;
                    }
                    case 8:
                    {
                        const updatedAgentPosition = this.computeTargetCell(
                            this.model.agent, currentAction, 2);

                        this.setGridValue(updatedAgentPosition, 0);
                        this.model.agent   = updatedAgentPosition;
                        this.currentAction = null;
                        this.movementIndex = 0;

                        break;
                    }
                }
            }
        }

        this.render();
        window.requestAnimationFrame(this.update.bind(this));
    }
}
