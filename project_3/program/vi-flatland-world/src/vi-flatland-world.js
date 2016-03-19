function getRandomIntInclusive(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(array)
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
}

const WorldEntity =
{
    void: 0, food: 1, poison: 2
};

const GameEntity =
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
};

var gameSpriteOffsets = {};
gameSpriteOffsets[GameEntity.dot]        = { x: 176, y:  0 };
gameSpriteOffsets[GameEntity.cherry]     = { x: 192, y:  0 };
gameSpriteOffsets[GameEntity.strawberry] = { x: 192, y: 16 };
gameSpriteOffsets[GameEntity.orange]     = { x: 192, y: 32 };
gameSpriteOffsets[GameEntity.apple]      = { x: 192, y: 48 };
gameSpriteOffsets[GameEntity.melon]      = { x: 192, y: 64 };
gameSpriteOffsets[GameEntity.blinky]     = { x:  64, y: 16 };
gameSpriteOffsets[GameEntity.pinky]      = { x:  64, y: 32 };
gameSpriteOffsets[GameEntity.inky]       = { x:  64, y: 48 };
gameSpriteOffsets[GameEntity.clyde]      = { x:  64, y: 64 };

const AgentState =
{
    still: 'still'
};

export function generateRandomWorld(
    worldWidth, worldHeight, food_probability, poison_probability)
{
    const numWorldCells  = worldWidth * worldHeight;
    const numFoodCells   = Math.round(food_probability * numWorldCells);
    const numPoisonCells = Math.round(
        poison_probability * (numWorldCells - numFoodCells));

    let cells = new Array(numWorldCells).fill(WorldEntity.void);

    const worldCells  = cells.map((cv, i) => i);
    const foodCells   = shuffle(worldCells.slice()).slice(0, numFoodCells);
    const poisonCells = shuffle(worldCells.filter((v) => foodCells.indexOf(v) == -1)).slice(0, numPoisonCells);
    const agentCell   = shuffle(worldCells.filter((v) => foodCells.indexOf(v) == -1 && poisonCells.indexOf(v) == -1))[0];

    for (let foodCell of foodCells)
    {
        cells[foodCell] = WorldEntity.food;
    }

    for (let poisonCell of poisonCells)
    {
        cells[poisonCell] = WorldEntity.poison;
    }

    return {
        cells:              cells,
        width:              worldWidth,
        height:             worldHeight,
        food_probability:   food_probability,
        poison_probability: poison_probability,
        agent:              { x: agentCell % worldWidth, y: Math.floor(agentCell / worldWidth) }
    }
}

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

export function buildGameModelFromWorldModel(world)
{
    const gridWidth    = 2 * world.width - 1;
    const gridHeight   = 2 * world.height - 1;
    const numGridCells = gridWidth * gridHeight;

    let gridCells = new Array(numGridCells).fill(GameEntity.void);

    const food = [GameEntity.cherry,
                  GameEntity.strawberry,
                  GameEntity.orange,
                  GameEntity.apple,
                  GameEntity.melon];

    const enemies = [GameEntity.blinky,
                     GameEntity.pinky,
                     GameEntity.inky,
                     GameEntity.clyde];

    // Place dots
    for (let y = 0; y < gridHeight; y += 2)
    {
        for (let x = 0; x < gridWidth; x += 1)
        {
            const index  = y * gridWidth + x;
            gridCells[index] = GameEntity.dot;
        }
    }

    for (let x = 0; x < gridWidth; x += 2)
    {
        for (let y = 1; y < gridHeight; y += 2)
        {
            const index  = y * gridWidth + x;
            gridCells[index] = GameEntity.dot;
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
                gridValue = shuffle(food.slice())[0];
            }
            else if (worldValue === WorldEntity.poison)
            {
                gridValue = shuffle(enemies.slice())[0];
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

export class vi_flatland_world
{
    constructor(options)
    {
        this.canvas                  = document.getElementById(options.element_id);
        this.context                 = this.canvas.getContext('2d');
        this.offscreenCanvas1        = document.createElement('canvas');
        this.offscreenCanvas1.width  = this.canvas.width;
        this.offscreenCanvas1.height = this.canvas.height;
        this.offscreenContext1       = this.offscreenCanvas1.getContext('2d');
        this.offscreenCanvas2        = document.createElement('canvas');
        this.offscreenCanvas2.width  = this.canvas.width;
        this.offscreenCanvas2.height = this.canvas.height;
        this.offscreenContext2       = this.offscreenCanvas2.getContext('2d');

        this.ca1 = this.offscreenCanvas1;
        this.ca2 = this.offscreenCanvas2;

        this.co1 = this.offscreenContext1;
        this.co2 = this.offscreenContext2;

        this.agentState = -1;

        this.model = buildGameModelFromWorldModel(
            generateRandomWorld(options.worldWidth, options.worldHeight, 1/3, 1/3));

        this.scheduledMove = -1;
        this.animationIndex = 0;

        this.sprites        = new Image();
        this.sprites.onload = window.setInterval.bind(window, this.update.bind(this), 33);
        //this.sprites.onload = window.requestAnimationFrame.bind(window, this.update.bind(this));
        this.sprites.src    = 'sprites.png';

        this.skip = false;
    }

    move(direction)
    {
        this.scheduledMove = direction;
    }

    update()
    {
        //if (this.skip)
        //{
            if (this.agentState === -1)
            {
                let move = this.scheduledMove;

                if (move !== -1)
                {
                    this.agentState     = move;
                    this.scheduledMove  = -1;
                }
            }
            else
            {
                this.animationIndex += 1;

                if (this.animationIndex === 5)
                {
                    switch (this.agentState)
                    {
                        case 0: this.model.cells[(this.model.agent.y - 1) * this.model.width + this.model.agent.x] = 0; break;
                        case 1: this.model.cells[(this.model.agent.y + 1) * this.model.width + this.model.agent.x] = 0; break;
                        case 2: this.model.cells[this.model.agent.y * this.model.width + this.model.agent.x - 1] = 0; break;
                        case 3: this.model.cells[this.model.agent.y * this.model.width + this.model.agent.x + 1] = 0; break;
                    }
                }
                else if (this.animationIndex === 8)
                {
                    switch (this.agentState)
                    {
                        case 0: this.model.agent.y -= 2; break;
                        case 1: this.model.agent.y += 2; break;
                        case 2: this.model.agent.x -= 2; break;
                        case 3: this.model.agent.x += 2; break;
                    }

                    this.model.cells[this.model.agent.y * this.model.width + this.model.agent.x] = 0;

                    this.animationIndex = 0;
                    this.agentState     = -1;
                }
            }

            this.render();
        //}

        //this.skip = !this.skip;

        this.renderToCanvas(this.co1);

        window.requestAnimationFrame(this.render.bind(this));
    }

    render()
    {
        this.context.drawImage(this.ca1, 0, 0);
        [this.ca1, this.ca2] = [this.ca2, this.ca1];
        [this.co1, this.co2] = [this.co2, this.co1];
    }

    renderToCanvas(context)
    {
        context.fillStyle = 'black';
        context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.model.height; y += 1)
        {
            for (let x = 0; x < this.model.height; x += 1)
            {
                const index = y * this.model.width + x;
                const value = this.model.cells[index];

                if (value !== GameEntity.void)
                {
                    const offsets = gameSpriteOffsets[value];
                    context.drawImage(this.sprites, offsets.x, offsets.y, 16, 16, 8 * x, 8 * y, 16, 16);
                }
            }
        }

        let ax = this.model.agent.x * 8;
        let ay = this.model.agent.y * 8;

        let sprite = 16;

        switch (this.agentState)
        {
            case 0: ay -= 2 * this.animationIndex; sprite = 16; break;
            case 1: ay += 2 * this.animationIndex; sprite = 32; break;
            case 2: ax -= 2 * this.animationIndex; sprite = 48; break;
            case 3: ax += 2 * this.animationIndex; sprite = 64; break;
        }

        context.drawImage(this.sprites, (this.animationIndex % 4) * 16, sprite, 16, 16, ax, ay, 16, 16);
    }
}
