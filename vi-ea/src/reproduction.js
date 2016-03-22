export class Sexual
{
    constructor(crossover_function, mutator_function)
    {
        this.crossover_function = crossover_function;
        this.mutator_function   = mutator_function;
    }

    reproduce(parent_selector)
    {
        const parent_a = parent_selector.next().value;
        const parent_b = parent_selector.next().value;

        let child_a_genotype = parent_a.genotype.slice();
        let child_b_genotype = parent_b.genotype.slice();

        [child_a_genotype, child_b_genotype] =
            this.crossover_function.apply(child_a_genotype, child_b_genotype);

        child_a_genotype = this.mutator_function.apply(child_a_genotype);
        child_b_genotype = this.mutator_function.apply(child_b_genotype);

        return [child_a_genotype, child_b_genotype];
    }
}
