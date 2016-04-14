export class Network
{
    constructor(inputs = [], hidden = [], outputs = [])
    {
        this.inputs  = inputs;
        this.hidden  = hidden;
        this.outputs = outputs;

        this.nodes = hidden.concat(outputs);
    }

    evaluate(inputs)
    {
        for (let i = 0; i < inputs.length; i++)
        {
            this.inputs[i].value = inputs[i];
        }

        for (const node of this.nodes)
        {
            node.step();
            node.update();
        }

//        for (const node of this.hidden)
//        {
//            node.step();
//        }
//
//        for (const node of this.hidden)
//        {
//            node.update();
//        }
//
//        for (const node of this.outputs)
//        {
//            node.step();
//        }
//
//        for (const node of this.outputs)
//        {
//            node.update();
//        }

        return this.outputs.map(output => output.value);
    }
}

export class Node
{
    constructor(constants, activationFunction, inputs = [], weights = [])
    {
        this.constants          = constants;
        this.activationFunction = activationFunction;
        this.inputs             = inputs;
        this.weights            = weights;

        this.state = 0;
        this.value = 0;
    }

    step()
    {
        let sum = 0;

        for (let i = 0; i < this.inputs.length; i++)
        {
            sum += this.weights[i] * this.inputs[i].value;
        }

        const derivative = (-this.state + sum + this.constants.bias) / this.constants.tau;

        this.state = this.state + derivative;
    }

    update()
    {
        this.value = this.activationFunction(this.constants.gain * this.state);
    }
}
