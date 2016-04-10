import * as ann from '../vi-ea/vi-ann';
import * as ea from '../vi-ea/vi-ea';
import * as math from 'mathjs';

export * from '../../vi-beer-tracker-widget/vi-beer-tracker-widget';

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

            for (const i = 0; i < options.develop.hiddenLayerSize; i++)
            {
                let hiddenLayerNode;

                [hiddenLayerNode, offset] = evaluateGenotypeNode(
                    genotype, offset, options.development, inputLayerSize);

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
            for (const i = 0; i < options.develop.hiddenLayerSize - 1; i++)
            {
                for (const j = i + 1; j < options.develop.hiddenLayerSize; j++)
                {
                    hiddenLayer[i].inputs.push(hiddenLayer[j]);
                    hiddenLayer[j].inputs.push(hiddenLayer[i]);
                }
            }

            const outputLayerSize = options.scenario.pullAction ? 3 : 2;
            const outputLayer     = [];

            for (const i = 0; i < outputLayerSize; i++)
            {
                let outputLayerNode;

                [outputLayerNode, offset] = evaluateGenotypeNode(
                    genotype, offset, options.development, hiddenLayerSize);

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
            for (const i = 0; i < outputLayerSize - 1; i++)
            {
                for (const j = i + 1; j < outputLayerSize; j++)
                {
                    outputLayer[i].inputs.push(outputLayer[j]);
                    outputLayer[j].inputs.push(outputLayer[i]);
                }
            }

            console.log("development function offset = " + offset);

            const network = new ann.ctrnn.Network(hiddenLayer.concat(outputLayer);

            return function(inputs)
            {
                for (const i = 0; i < inputLayerSize; i++)
                {
                    inputLayer[i].value = inputs[i];
                }

                network.evaluate();

                return outputLayer.map(outputLayerNode => outputLayerNode.value);
            };
        }
    };
}

export function createGenotypeCreator(options)
{
    const inputLayerSize =
        options.world.wraps ? options.world.trackerSize : options.world.trackerSize + 2;

    const hiddenLayerInputConnections =
        inputLayerSize * options.develop.hiddenLayerSize;

    const hiddenLayerInterNodeRecurrentConnections =
        (options.develop.hiddenLayerSize - 1) * options.develop.hiddenLayerSize;

    const hiddenLayerIntraNodeRecurrentConnections =
        options.develop.hiddenLayerSize;

    const hiddenLayerBiasConnections =
        options.develop.hiddenLayerSize;

    const outputLayerSize = options.scenario.pullAction ? 3 : 2;

    const outputLayerInputConnections =
        options.develop.hiddenLayerSize * outputLayerSize;

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

    const nodeCount = options.develop.hiddenLayerSize + outputLayerSize;

    const genotypeSize =
        weightCount * (options.develop.weights.bits + options.develop.weightSwitchBits) +
        biasCount   * options.develop.bias.bits +
        nodeCount   * (options.develop.tau.bits + options.develop.gain.bits);

    console.log('genotype size = ' + genotypeSize);

    return ea.fixedBitVector.Creator(genotypeSize);
}

export function evaluateAgent(world, agent, timeSteps)
{
    const result =
    {
        captures:   0,
        collisions: 0,
        moves:      0
    };

    let trackerPosition = math.randomInt(
        world.wraps ? world.width : world.width - world.trackerSize + 1);

    let object = null;

    while (timeSteps --> 0)
    {
        if (!object)
        {
            const objectSize = math.randomInt(1, world.trackerSize + 2);

            object =
            {
                size: objectSize,
                x:    math.randomInt(world.wraps ? world.width : world.width - objectSize + 1),
                y:    0
            };
        }

        const action = agent.act(world);

        trackerPosition += action.movement;

        if (world.wraps)
        {
            trackerPosition = (trackerPosition + world.width) % world.width;
        }
        else
        {
            trackerPosition = Math.min(world.width - 1, Math.max(0, trackerPosition));
        }

        if (object)
        {
            object.y += 1;

            if (action.pull || object.y === world.height - 1)
            {
                const adjusted = (object.x - trackerPosition + world.width) % this.grid.width;

                if (object.size < this.world.trackerSize)
                {
                    result.captures += adjusted + object.width < this.world.trackerSize;
                }
                else
                {
                    result.collisions += adjusted < this.world.trackerSize;
                }

                object = null;
            }
        }
    }

    return result;
}

function evaluateGenotypeNode(genotype, offset, config, inputCount)
{
    var gain, tau, bias;

    [gain, offset] = evaluateGenotypeParameter(genotype, offset, config.gain, config.grayCoding);
    [tau,  offset] = evaluateGenotypeParameter(genotype, offset, config.tau,  config.grayCoding);
    [bias, offset] = evaluateGenotypeParameter(genotype, offset, config.bias, config.grayCoding);

    const node = new ann.ctrnn.Node(
        { gain: gain, tau: tau, bias: bias },
        ann.activation[config.activation]);

    for (const i = 0; i < inputCount; i++)
    {
        const weightEnabled = !config.weightSwitchBits || genotype[offset++];

        var weight;
        [weight, offset] = evaluateGenotypeParameter(genotype, offset, config.weight, config.grayCoding);

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

