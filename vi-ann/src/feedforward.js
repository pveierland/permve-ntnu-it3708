export class Network
{
    constructor(layers)
    {
        this.layers = layers;
    }

    evaluate(inputs)
    {
        for (let layer of this.layers)
        {
            inputs = layer.propagate(inputs);
        }

        return inputs;
    }
}

export class Layer
{
    constructor(bias, weights, activationFunction)
    {
        this.bias               = bias;
        this.weights            = weights;
        this.activationFunction = activationFunction;

        this.outputs = new Array(this.size);
    }

    propagate(inputs)
    {
        const inputSize  = inputs.length;
        const outputSize = this.outputs.length;

        for (let j = 0; j < outputSize; j += 1)
        {
            let sum = this.bias[j];

            for (let i = 0; i < inputSize; i += 1)
            {
                sum += this.weights[j * inputSize + i] * inputs[i];
            }

            this.outputs[j] = this.activationFunction(sum);
        }

        return this.outputs;
    }

    get size()
    {
        return this.bias.length;
    }
}
