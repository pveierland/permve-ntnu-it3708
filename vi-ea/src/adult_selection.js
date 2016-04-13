export class FullGenerationalReplacement
{
    select(populationSize, childGenerator)
    {
        let nextGeneration = new Array(populationSize);

        for (let i = 0; i != populationSize; i++)
        {
            nextGeneration[i] = childGenerator.next().value;
        }

        return nextGeneration;
    }
}
