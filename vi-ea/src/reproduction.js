export class Sexual
{
    constructor(crossoverFunction, mutatorFunction)
    {
        this.crossoverFunction = crossoverFunction;
        this.mutatorFunction   = mutatorFunction;
    }

    reproduce(parentSelector)
    {
        const firstParent  = parentSelector.next().value;
        const secondParent = parentSelector.next().value;

        let firstChildGenotype  = firstParent.genotype.slice();
        let secondChildGenotype = secondParent.genotype.slice();

        [firstChildGenotype, secondChildGenotype] =
            this.crossoverFunction.apply(firstChildGenotype, secondChildGenotype);

        firstChildGenotype  = this.mutatorFunction.apply(firstChildGenotype);
        secondChildGenotype = this.mutatorFunction.apply(secondChildGenotype);

        return [firstChildGenotype, secondChildGenotype];
    }
}
