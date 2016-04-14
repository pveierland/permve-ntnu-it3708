import * as math from 'mathjs';

import * as ann from '../../vi-ann/vi-ann';
import * as ea from '../../vi-ea/vi-ea';
import * as utility from '../../vi-utility/vi-utility';

import { stepWorld, Widget } from '../../vi-beer-tracker-widget/vi-beer-tracker-widget';

export { ann, ea, Widget };

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

                inputs[0] = ((adjusted <= 0 && adjusted > 0 - world.object.size) || overlap > 0) ? 1 : 0;
                inputs[1] = ((adjusted <= 1 && adjusted > 1 - world.object.size) || overlap > 1) ? 1 : 0;
                inputs[2] = ((adjusted <= 2 && adjusted > 2 - world.object.size) || overlap > 2) ? 1 : 0;
                inputs[3] = ((adjusted <= 3 && adjusted > 3 - world.object.size) || overlap > 3) ? 1 : 0;
                inputs[4] = ((adjusted <= 4 && adjusted > 4 - world.object.size) || overlap > 4) ? 1 : 0;
            }

            if (!world.wraps)
            {
                // Add edge detection sensors
                inputs[5] = (world.trackerPosition === 0) ? 1 : 0;
                inputs[6] = (world.trackerPosition === world.width - world.trackerSize) ? 1 : 0;
            }

            const outputs = network.evaluate(inputs);

            let action = { pull: false };

            if (outputs.length > 2 && outputs[2] > 0.5)
            {
                action.pull = true;
            }
            else
            {
                const direction = outputs[0] < 0.5 ? -1 : 1;
                const magnitude = Math.floor(4 * outputs[1]);
                action.move = direction * magnitude;
                //const direction = outputs[1] > outputs[0];
                //action.move = (direction ? 1 : -1) * (4 * Math.round(Math.min(1, Math.max(outputs[direction ? 1 : 0]))));
            }

//            else if (outputs[0] > outputs[1])
//            {
//                action.move = 4 - Math.round(3 * Math.min(1, Math.max(0, outputs[0])))
//            }
//            else
//            {
//                action.move = -(4 - Math.round(3 * Math.min(1, Math.max(0, outputs[1]))));
//            }

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

export function createFitnessEvaluationStrategy(fitnessExpression, world, timeSteps, spawns)
{
    return {
        evaluate: function(system, genotype, phenotype)
        {
            const agent  = createAgent(phenotype);
            const result = evaluateAgent(agent, world, timeSteps, spawns);

            result.generation      = system.generation;
            result.generationCount = system.generationCount;

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
        outputLayerInputConnections +
        hiddenLayerInterNodeRecurrentConnections +
        hiddenLayerIntraNodeRecurrentConnections +
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

export function evaluateAgent(agent, world, timeSteps, spawns)
{
    const result =
    {
        bigAvoids:     0,
        bigCaptures:   0,
        bigCrashes:    0,
        idle:          0,
        moves:         0,
        smallAvoids:   0,
        smallCaptures: 0,
        smallCrashes:  0
    };

    world = JSON.parse(JSON.stringify(world));

    if (spawns)
    {
        spawns = JSON.parse(JSON.stringify(spawns));
    }

    world.trackerPosition = math.randomInt(
        world.wraps ? world.width : world.width - world.trackerSize + 1);

    while (timeSteps --> 0)
    {
        stepWorld(world, agent, spawns);

        result.idle          += world.idle;
        result.moves         += world.moves;
        result.bigAvoids     += world.bigAvoid;
        result.bigCrashes    += world.bigCrash;
        result.bigCaptures   += world.bigCapture;
        result.smallAvoids   += world.smallAvoid;
        result.smallCrashes  += world.smallCrash;
        result.smallCaptures += world.smallCapture;
    }

    result.smallTotal = result.smallAvoids + result.smallCrashes + result.smallCaptures;
    result.bigTotal   = result.bigAvoids   + result.bigCrashes   + result.bigCaptures;

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

