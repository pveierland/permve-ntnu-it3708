import * as World from '../vi-flatland-world/vi-flatland-world';
export { World };

export const Action =
{
    stay: 1, moveLeft: 2, moveForward: 3, moveRight: 4
};

export const Heading =
{
    up: 0, right: 1, down: 2, left: 3
};

export const WorldEntity = Object.freeze(
{
    void: 0, food: 1, poison: 2
});

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
        agent: {
            x:       agentCell % worldWidth,
            y:       Math.floor(agentCell / worldWidth),
            heading: Utility.getRandomIntInclusive(Heading.up, Heading.right)
        }
    }
}

export function buildGameModelFromWorldModel(world)
{
    const gridWidth    = 2 * world.width - 1;
    const gridHeight   = 2 * world.height - 1;
    const numGridCells = gridWidth * gridHeight;

    let gridCells = new Array(numGridCells).fill(World.GameEntity.void);

    // Place dots
    for (let y = 0; y < gridHeight; y += 1)
    {
        for (let x = 0; x < gridWidth; x += 1)
        {
            if (y % 2 == 0 || x % 2 == 0)
            {
                const index      = y * gridWidth + x;
                gridCells[index] = World.GameEntity.dot;
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

            let gridValue = World.GameEntity.void;

            if (worldValue === WorldEntity.food)
            {
                gridValue = Utility.shuffle(World.Constants.food.slice())[0];
            }
            else if (worldValue === WorldEntity.poison)
            {
                gridValue = Utility.shuffle(World.Constants.enemies.slice())[0];
            }

            if (gridValue !== World.GameEntity.void)
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

export function evaluateRun(world, actions)
{
    actions = actions.slice();
    world   = JSON.parse(JSON.stringify(world));

    let foodEaten = 0, poisonEaten = 0;

    while (actions.length > 0)
    {
        const action = actions.shift();

        if (action !== Action.stay)
        {
            switch (action)
            {
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

            switch (world.agent.heading)
            {
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

            const entity = world.cells[world.agent.y * world.width + world.agent.x];

            switch (entity)
            {
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
