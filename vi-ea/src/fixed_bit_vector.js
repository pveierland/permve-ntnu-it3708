import * as math from 'mathjs';

export class Creator
{
    constructor(length, valueDistribution = 0.5)
    {
        this.length            = length;
        this.valueDistribution = valueDistribution;
    }

    create()
    {
        return Array.from(
            {length: this.length},
            () => Math.random() < this.valueDistribution);
    }
}

export class Crossover
{
    constructor(minCrossoverPoints, maxCrossoverPoints = undefined)
    {
        this.minCrossoverPoints = minCrossoverPoints;
        this.maxCrossoverPoints = maxCrossoverPoints || minCrossoverPoints;
    }

    apply(a, b)
    {
        const length = a.length;
        const point  = math.randomInt(1, length);

        for (let i = point; i != length; i += 1)
        {
            [a[i], b[i]] = [b[i], a[i]]
        }

        return [a, b];
    }
}

export class Mutator
{
    constructor(bitMutationRate)
    {
        this.bitMutationRate = bitMutationRate;
    }

    apply(value)
    {
        value.forEach((v, i, a) =>
        {
            if (Math.random() < this.bitMutationRate)
            {
                a[i] = !a[i];
            }
        });

        return value;
    }
}

export function diversity(population)
{
    const populationSize = population.length;
    const genotypeLength = population[0].genotype.length;

    let valueDistribution = Array(genotypeLength).fill(0);

    for (let individual of population)
    {
        for (let k = 0; k < genotypeLength; k++)
        {
            if (individual.genotype[k])
            {
                valueDistribution[k] += 1;
            }
        }
    }

    let diversity = 0;

    for (let k = 0; k < genotypeLength; k++)
    {
        const frequency = valueDistribution[k] / populationSize;

        if (frequency !== 0 && frequency !== 1)
        {
            diversity -= frequency * Math.log2(frequency) + (1 - frequency) * Math.log2(1 - frequency);
        }
    }

    return diversity;
}

