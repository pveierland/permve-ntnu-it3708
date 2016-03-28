import * as math from 'mathjs';

export class Creator
{
    constructor(length, minValue, maxValue)
    {
        this.length   = length;
        this.minValue = minValue;
        this.maxValue = maxValue;
    }

    create()
    {
        return Array.from(
            { length: this.length },
            () => math.random(this.minValue, this.maxValue));
    }
}

export class Mutator
{

}
