import * as math from 'mathjs';

import * as ann from '../../vi-ann/vi-ann';
import * as ea from '../../vi-ea/vi-ea';
import * as utility from '../../vi-utility/vi-utility';

export { ann, ea };

export * from '../../vi-beer-tracker-widget/vi-beer-tracker-widget';

export function createAgent(network)
{
    return {
        act: function(world)
        {
            let inputs = Array(world.wraps
                ? world.trackerSize : world.trackerSize + 2).fill(0);

            if (world.object)
            {
                const adjusted = (world.object.x - world.trackerPosition + world.width) % world.width;
                const overlap  = (adjusted + world.object.size) - world.width;

                inputs[0] = (adjusted <= 0 || overlap > 0) ? 1 : 0;
                inputs[1] = (adjusted <= 1 || overlap > 1) ? 1 : 0;
                inputs[2] = (adjusted <= 2 || overlap > 2) ? 1 : 0;
                inputs[3] = (adjusted <= 3 || overlap > 3) ? 1 : 0;
                inputs[4] = (adjusted <= 4 || overlap > 4) ? 1 : 0;
            }

            if (!world.wraps)
            {
                // Add edge detection sensors
                inputs[5] = (world.trackerPosition === 0) ? 1 : 0;
                inputs[6] = (world.trackerPosition === world.width - world.trackerSize) ? 1 : 0;
            }

            const outputs = network.evaluate(inputs);

            let action =
            {
                move: (Math.round(4 * Math.min(1, Math.max(0, outputs[1])))
                      - Math.round(4 * Math.min(1, Math.max(0, outputs[0]))))
            };

            if (outputs.length > 2)
            {
                action.pull = outputs[2] >= 0.5;
            }

            return action;
        }
    };
}

export function createDevelopmentStrategy(options)
{
    return {
        develop: function(genotype)
        {
            let offset = 0;

            const inputLayerSize =
                options.world.wraps ? options.world.trackerSize : options.world.trackerSize + 2;

            const inputLayer = Array(inputLayerSize).fill(0).map(() => ({ value: 0 }));

            const hiddenLayer = [];

            for (let i = 0; i < options.development.hiddenLayerSize; i++)
            {
                let hiddenLayerNode;

                [hiddenLayerNode, offset] = evaluateGenotypeNode(
                    genotype,
                    offset,
                    options.development,
                    inputLayerSize + options.development.hiddenLayerSize);

                // Intra-node recurrent link
                hiddenLayerNode.inputs.push(hiddenLayerNode);

                // Input links
                for (const inputNode of inputLayer)
                {
                    hiddenLayerNode.inputs.push(inputNode);
                }

                hiddenLayer.push(hiddenLayerNode);
            }

            // Inter-node recurrent links
            for (let i = 0; i < options.development.hiddenLayerSize - 1; i++)
            {
                for (let j = i + 1; j < options.development.hiddenLayerSize; j++)
                {
                    hiddenLayer[i].inputs.push(hiddenLayer[j]);
                    hiddenLayer[j].inputs.push(hiddenLayer[i]);
                }
            }

            const outputLayerSize = options.scenario.pullAction ? 3 : 2;
            const outputLayer     = [];

            for (let i = 0; i < outputLayerSize; i++)
            {
                let outputLayerNode;

                [outputLayerNode, offset] = evaluateGenotypeNode(
                    genotype,
                    offset,
                    options.development,
                    options.development.hiddenLayerSize + outputLayerSize);

                // Intra-node recurrent link
                outputLayerNode.inputs.push(outputLayerNode);

                // Input links
                for (const hiddenNode of hiddenLayer)
                {
                    outputLayerNode.inputs.push(hiddenNode);
                }

                outputLayer.push(outputLayerNode);
            }

            // Inter-node recurrent links
            for (let i = 0; i < outputLayerSize - 1; i++)
            {
                for (let j = i + 1; j < outputLayerSize; j++)
                {
                    outputLayer[i].inputs.push(outputLayer[j]);
                    outputLayer[j].inputs.push(outputLayer[i]);
                }
            }

            return new ann.ctrnn.Network(
                inputLayer, hiddenLayer, outputLayer);
        }
    };
}

export function createFitnessEvaluationStrategy(fitnessExpression, world, timeSteps)
{
    return {
        evaluate: function(phenotype)
        {
            const agent  = createAgent(phenotype);
            const result = evaluateAgent(agent, world, timeSteps);
            return fitnessExpression.eval(result);
        }
    };
}

export function createGenotypeCreator(options)
{
    const inputLayerSize =
        options.world.wraps ? options.world.trackerSize : options.world.trackerSize + 2;

    const hiddenLayerInputConnections =
        inputLayerSize * options.development.hiddenLayerSize;

    const hiddenLayerInterNodeRecurrentConnections =
        (options.development.hiddenLayerSize - 1) * options.development.hiddenLayerSize;

    const hiddenLayerIntraNodeRecurrentConnections =
        options.development.hiddenLayerSize;

    const hiddenLayerBiasConnections =
        options.development.hiddenLayerSize;

    const outputLayerSize = options.scenario.pullAction ? 3 : 2;

    const outputLayerInputConnections =
        options.development.hiddenLayerSize * outputLayerSize;

    const outputLayerInterNodeRecurrentConnections =
        (outputLayerSize - 1) * outputLayerSize;

    const outputLayerIntraNodeRecurrentConnections =
        outputLayerSize;

    const outputLayerBiasConnections =
        outputLayerSize;

    const weightCount =
        hiddenLayerInputConnections +
        hiddenLayerInterNodeRecurrentConnections +
        hiddenLayerIntraNodeRecurrentConnections +
        outputLayerInputConnections +
        outputLayerInterNodeRecurrentConnections +
        outputLayerIntraNodeRecurrentConnections;

    const biasCount =
        hiddenLayerBiasConnections +
        outputLayerBiasConnections;

    const nodeCount = options.development.hiddenLayerSize + outputLayerSize;

    const genotypeSize =
        weightCount * (options.development.weights.bits + options.development.weightSwitchBits) +
        biasCount   * options.development.bias.bits +
        nodeCount   * (options.development.tau.bits + options.development.gain.bits);

    return new ea.fixedBitVector.Creator(genotypeSize);
}

export function evaluateAgent(agent, world, timeSteps)
{
    const result =
    {
        captureSpawns:   0,
        captures:        0,
        collisionSpawns: 0,
        collisions:      0,
        moves:           0
    };

    world = JSON.parse(JSON.stringify(world));

    world.trackerPosition = math.randomInt(
        world.wraps ? world.width : world.width - world.trackerSize + 1);

    const numObjects = Math.floor(timeSteps / (world.height - 1));
    let objects = utility.shuffle(Array(numObjects).fill(0).map((v, i) => (i % world.trackerSize) + 1));

    world.object = null;

    while (timeSteps --> 0)
    {
        if (!world.object)
        {
            //const objectSize = math.randomInt(1, world.trackerSize + 2);
            const objectSize = objects.shift();

            world.object =
            {
                size: objectSize,
                x:    math.randomInt(world.wraps ? world.width : world.width - objectSize + 1),
                y:    0
            };

            result.captureSpawns   += objectSize <  world.trackerSize;
            result.collisionSpawns += objectSize >= world.trackerSize;
        }

        const action = agent.act(world);

        world.trackerPosition += action.move;
        result.moves          += Math.abs(action.move);

        if (world.wraps)
        {
            world.trackerPosition = (world.trackerPosition + world.width) % world.width;
        }
        else
        {
            world.trackerPosition = Math.min(world.width - 1, Math.max(0, world.trackerPosition));
        }

        if (world.object)
        {
            world.object.y += 1;

            if (action.pull || world.object.y === world.height - 1)
            {
                const adjusted = (world.object.x - world.trackerPosition + world.width) % world.width;
                const overlap  = (adjusted + world.object.size) - world.width;

                if (world.object.size < world.trackerSize)
                {
                    result.captures += adjusted + world.object.size <= world.trackerSize;
                }
                else
                {
                    result.collisions += adjusted < world.trackerSize || overlap > 0;
                }

                world.object = null;
            }
        }
    }

    return result;
}

function evaluateGenotypeNode(genotype, offset, config, inputCount)
{
    let gain, tau, bias;

    [gain, offset] = evaluateGenotypeParameter(genotype, offset, config.gain, config.grayCoding);
    [tau,  offset] = evaluateGenotypeParameter(genotype, offset, config.tau,  config.grayCoding);
    [bias, offset] = evaluateGenotypeParameter(genotype, offset, config.bias, config.grayCoding);

    const node = new ann.ctrnn.Node(
        { gain: gain, tau: tau, bias: bias },
        ann.activation[config.activation]);

    for (let i = 0; i < inputCount; i++)
    {
        const weightEnabled = !config.weightSwitchBits || genotype[offset++];

        let weight;
        [weight, offset] = evaluateGenotypeParameter(genotype, offset, config.weights, config.grayCoding);

        node.weights.push(weightEnabled * weight);
    }

    return [node, offset];
}

function evaluateGenotypeParameter(genotype, offset, config, grayCoding)
{
    let value = 0;

    for (let i = 0; i < config.bits; i++)
    {
        value |= genotype[offset + i] ? 2 << i : 0;
    }

    if (grayCoding)
    {
        let decoded = value;

        while (value >>= 1)
        {
            decoded ^= value;
        }

        value = decoded;
    }

    value = (config.inclusiveRangeStart
          + (value / ((2 << config.bits) - 1))
          * (config.inclusiveRangeEnd - config.inclusiveRangeStart));

    return [value, offset + config.bits];
}

