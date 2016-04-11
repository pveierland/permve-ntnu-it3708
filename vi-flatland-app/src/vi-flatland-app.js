import * as math from 'mathjs';

import * as ann from '../../vi-ann/vi-ann';
import * as ea from '../../vi-ea/vi-ea';
import * as flatlandWorld from '../../vi-flatland-world/vi-flatland-world';
import * as utility from '../../vi-utility/vi-utility';

export { ann, ea, flatlandWorld };

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
};

function computeTargetCell(world, heading)
{
    switch (heading)
    {
        case Heading.up:
        {
            return { x: world.agent.x, y: (world.agent.y - 1 + world.height) % world.height };
        }
        case Heading.down:
        {
            return { x: world.agent.x, y: (world.agent.y + 1) % world.height };
        }
        case Heading.left:
        {
            return { x: (world.agent.x - 1 + world.width) % world.width, y: world.agent.y };
        }
        case Heading.right:
        {
            return { x: (world.agent.x + 1) % world.width, y: world.agent.y };
        }
    }
};

function getNeighborFromHeading(world, heading)
{
    const target = computeTargetCell(world, heading);
    return world.cells[target.y * world.width + target.x];
};

export function generateRandomWorld(options)
{
    const cellCount = options.width * options.height;
    const foodCount = Math.round(
        options.foodProbability * cellCount);
    const poisonCount = Math.round(
        options.poisonProbability * (cellCount - foodCount));

    let cells = new Array(cellCount).fill(WorldEntity.void);

    let availableCells = utility.shuffle(cells.map((cv, i) => i));
    const foodCells    = availableCells.splice(0, foodCount);
    const poisonCells  = availableCells.splice(0, poisonCount);
    const agentCell    = availableCells.splice(0, 1)[0];

    for (let foodCell of foodCells)
    {
        cells[foodCell] = WorldEntity.food;
    }

    for (let poisonCell of poisonCells)
    {
        cells[poisonCell] = WorldEntity.poison;
    }

    return {
        cells:             cells,
        width:             options.width,
        height:            options.height,
        foodProbability:   options.foodProbability,
        poisonProbability: options.poisonProbability,
        foodCount:         foodCount,
        poisonCount:       poisonCount,
        agent: {
            x:       agentCell % options.width,
            y:       Math.floor(agentCell / options.width),
            heading: math.randomInt(Heading.up, Heading.right + 1)
        }
    }
}

export function buildGameModelFromWorldModel(world)
{
    const gridWidth    = 2 * world.width - 1;
    const gridHeight   = 2 * world.height - 1;
    const numGridCells = gridWidth * gridHeight;

    let gridCells = new Array(numGridCells).fill(flatlandWorld.GameEntity.void);

    // Place dots
    for (let y = 0; y < gridHeight; y += 1)
    {
        for (let x = 0; x < gridWidth; x += 1)
        {
            if (y % 2 == 0 || x % 2 == 0)
            {
                const index      = y * gridWidth + x;
                gridCells[index] = flatlandWorld.GameEntity.dot;
            }
        }
    }

    // Place food and enemies

    // Food and enemy index is used such that the type of fruit
    // and type of enemy is chosen deterministically. Otherwise,
    // several runs with the same model will look confusing.
    let foodIndex  = 0;
    let enemyIndex = 0;

    for (let row = 0; row < world.height; row += 1)
    {
        for (let column = 0; column < world.width; column += 1)
        {
            const worldIndex = row * world.width + column;
            const worldValue = world.cells[worldIndex];
            const gridIndex  = 2 * row * gridWidth + 2 * column;

            let gridValue = flatlandWorld.GameEntity.void;

            if (worldValue === WorldEntity.food)
            {
                gridValue = flatlandWorld.Constants.food[foodIndex];
                foodIndex = (foodIndex + 1) % flatlandWorld.Constants.food.length;
            }
            else if (worldValue === WorldEntity.poison)
            {
                gridValue  = flatlandWorld.Constants.enemies[enemyIndex];
                enemyIndex = (enemyIndex + 1) % flatlandWorld.Constants.enemies.length;
            }

            if (gridValue !== flatlandWorld.GameEntity.void)
            {
                gridCells[gridIndex] = gridValue;
                clearGridNeighbors(
                    gridCells, 2 * column, 2 * row, gridWidth, gridHeight);
            }
        }
    }

    gridCells[2 * world.agent.y * gridWidth + 2 * world.agent.x] = 0;
    clearGridNeighbors(
        gridCells, 2 * world.agent.x, 2 * world.agent.y, gridWidth, gridHeight);

    return {
        cells:      gridCells,
        width:      gridWidth,
        height:     gridHeight,
        foodCount:  world.foodCount,
        enemyCount: world.poisonCount,
        agent:
        {
            x: world.agent.x * 2,
            y: world.agent.y * 2
        }
    };
}

export function evaluateRun(world, agent, timeSteps)
{
    world = JSON.parse(JSON.stringify(world));

    let foodEaten = 0, poisonEaten = 0, moves = [];

    while (timeSteps --> 0)
    {
        const action = agent.act(world);

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
                    moves.push(flatlandWorld.Action.moveUp);
                    world.agent.y = (world.agent.y - 1 + world.height) % world.height;
                    break;
                }
                case Heading.down:
                {
                    moves.push(flatlandWorld.Action.moveDown);
                    world.agent.y = (world.agent.y + 1) % world.height;
                    break;
                }
                case Heading.left:
                {
                    moves.push(flatlandWorld.Action.moveLeft);
                    world.agent.x = (world.agent.x - 1 + world.width) % world.width;
                    break;
                }
                case Heading.right:
                {
                    moves.push(flatlandWorld.Action.moveRight);
                    world.agent.x = (world.agent.x + 1) % world.width;
                    break;
                }
            }

            const entityOffset = world.agent.y * world.width + world.agent.x;
            const entity       = world.cells[entityOffset];

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

            world.cells[entityOffset] = WorldEntity.void;
        }
        else
        {
            moves.push(flatlandWorld.Action.stay);
        }
    }

    return { foodEaten: foodEaten, poisonEaten: poisonEaten, moves: moves };
}

//const biasBits = 4;
//
//function setBias(bias, genotype, inputNodes, layerNodes, genotypeLayerOffset)
//{
//    for (let node = 0; node < layerNodes; node++)
//    {
//        const offset     = genotypeLayerOffset + node * (2 * inputNodes + biasBits) + 2 * inputNodes;
//        const isNegative = genotype[offset + 3];
//        const value      = (genotype[offset + 0] | 0) + (genotype[offset + 1] | 0) * 2 + (genotype[offset + 2] | 0) * 4;
//
//        bias[node] = isNegative ? value - 8 : value;
//    }
//}
//
//function setWeights(weights, genotype, inputNodes, layerNodes, genotypeOffset)
//{
//    for (let node = 0; node < layerNodes; node++)
//    {
//        for (let inputNode = 0; inputNode < inputNodes; inputNode++)
//        {
//            const offset = genotypeOffset + node * (2 * inputNodes + biasBits) + 2 * inputNode;
//            weights[node * inputNodes + inputNode] = (genotype[offset] | 0) * (genotype[offset + 1] ? 1 : -1);
//        }
//    }
//}

//let stepFunction = function(stepValue)
//{
//    return function(input)
//    {
//        return input >= stepValue ? 1 : 0;
//    }
//}
//
//export function genotypeDevelopmentStrategy(genotype)
//{
//    const inputNodes  = 6;
//    const hiddenNodes = 6;
//    const outputNodes = 3;
//
//    let hiddenLayerBias    = new Array(hiddenNodes);
//    let hiddenLayerWeights = new Array(inputNodes * hiddenNodes);
//
//    setWeights(hiddenLayerWeights, genotype, inputNodes, hiddenNodes, 0);
//    setBias(hiddenLayerBias, genotype, inputNodes, hiddenNodes, 0);
//
//    let outputLayerBias = new Array(outputNodes);
//    let outputLayerWeights = new Array(hiddenNodes * outputNodes);
//
//    setWeights(outputLayerWeights, genotype, hiddenNodes, outputNodes, 2 * inputNodes * hiddenNodes + biasBits * hiddenNodes);
//    setBias(outputLayerBias, genotype, hiddenNodes, outputNodes, 2 * inputNodes * hiddenNodes + biasBits * hiddenNodes);
//
//    return new ann.feedforward.Network([
//        new ann.feedforward.Layer(hiddenLayerBias, hiddenLayerWeights, stepFunction(1)),
//        new ann.feedforward.Layer(outputLayerBias, outputLayerWeights, stepFunction(1))]);
//}

function evaluateWeight(genotype, offset, config, weightConfig)
{
    if (config.weightSwitchBits && !genotype[offset])
    {
        return 0;
    }

    let value = 0;

    for (let i = 0; i < weightConfig.bits; i++)
    {
        value |= genotype[offset + config.weightSwitchBits + i] ? 2 << i : 0;
    }

    if (config.grayCoding)
    {
        let decoded = value;

        while (value >>= 1)
        {
            decoded ^= value;
        }

        value = decoded;
    }

    value = (weightConfig.inclusiveRangeStart
          + (value / ((2 << weightConfig.bits) - 1))
          * (weightConfig.inclusiveRangeEnd - weightConfig.inclusiveRangeStart));

    return value;
}

function evaluateLayer(genotype, offset, config, inputLayerConfig, layerConfig)
{
    let bias    = new Array(layerConfig.size);
    let weights = new Array(layerConfig.size * inputLayerConfig.size);

    for (let layerNode = 0; layerNode < layerConfig.size; layerNode++)
    {
        bias[layerNode] = evaluateWeight(
            genotype,
            offset,
            config,
            layerConfig.bias);

        offset += layerConfig.bias.bits;

        for (let inputNode = 0; inputNode < inputLayerConfig.size; inputNode++)
        {
            weights[layerNode * inputLayerConfig.size + inputNode] = evaluateWeight(
                genotype, offset, config, layerConfig.weights);

            offset += layerConfig.weights.bits;
        }
    }

    return {
        layer:  new ann.feedforward.Layer(
            bias, weights, ann.activation[layerConfig.activation]),
        offset: offset
    };
}

export function createGenotypeCreator(options)
{
    const hiddenLayerBits = (options.hiddenLayer.size
        * (options.hiddenLayer.bias.bits + options.inputLayer.size
            * (options.hiddenLayer.weights.bits + options.weightSwitchBits)));
    const outputLayerBits = (options.outputLayer.size
        * (options.outputLayer.bias.bits + options.hiddenLayer.size
            * (options.outputLayer.weights.bits + options.weightSwitchBits)));

    console.log('GENOTYPE SIZE = ' + (hiddenLayerBits + outputLayerBits));

    return new ea.fixedBitVector.Creator(hiddenLayerBits + outputLayerBits);
}

export function createDevelopmentFunction(options)
{
    return function(genotype)
    {
        const hidden = evaluateLayer(
            genotype, 0, options, options.inputLayer, options.hiddenLayer);

        const output = evaluateLayer(
            genotype, hidden.offset, options, options.hiddenLayer, options.outputLayer);

        return new ann.feedforward.Network([hidden.layer, output.layer]);
    };
}

export function createFitnessFunction(fitnessExpression, worlds, timeSteps)
{
    let totalFoodCount = 0, totalPoisonCount = 0;

    for (const world of worlds)
    {
        totalFoodCount   += world.foodCount;
        totalPoisonCount += world.poisonCount;
    }

    return function(phenotype)
    {
        const agent       = new Agent(phenotype);
        const evaluations = worlds.map(
            world => evaluateRun(world, agent, timeSteps));

        let totalFoodEaten = 0, totalPoisonEaten = 0;

        for (const evaluation of evaluations)
        {
            totalFoodEaten   += evaluation.foodEaten;
            totalPoisonEaten += evaluation.poisonEaten;
        }

        return fitnessExpression.eval(
        {
            foodEaten:   totalFoodEaten,
            poisonEaten: totalPoisonEaten,
            foodCount:   totalFoodCount,
            poisonCount: totalPoisonCount
        });
    };
}

export class Agent
{
    constructor(network)
    {
        this.network = network;
    }

    act(world)
    {
        const leftHeading  = (world.agent.heading - 1 + 4) % 4;
        const rightHeading = (world.agent.heading + 1) % 4;

        const leftValue    = getNeighborFromHeading(world, leftHeading);
        const forwardValue = getNeighborFromHeading(world, world.agent.heading);
        const rightValue   = getNeighborFromHeading(world, rightHeading);

        const inputs = [
            forwardValue === WorldEntity.food   ? 1 : 0,
            leftValue    === WorldEntity.food   ? 1 : 0,
            rightValue   === WorldEntity.food   ? 1 : 0,
            forwardValue === WorldEntity.poison ? 1 : 0,
            leftValue    === WorldEntity.poison ? 1 : 0,
            rightValue   === WorldEntity.poison ? 1 : 0 ];

        const outputs = this.network.evaluate(inputs);

        if (outputs[0] > outputs[1] && outputs[0] > outputs[2])
        {
            return Action.moveForward;
        }
        else if (outputs[1] > outputs[0] && outputs[1] > outputs[2])
        {
            return Action.moveLeft;
        }
        else if (outputs[2] > outputs[0] && outputs[2] > outputs[1])
        {
            return Action.moveRight;
        }
        else
        {
            //return Action.moveForward;
            return Action.stay;
        }
    }
}

