function get_random_int_inclusive(min, max)
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class Creator
{
    constructor(length, value_distribution=0.5)
    {
        this.length             = length;
        this.value_distribution = value_distribution;
    }

    create()
    {
        return Array.from(
            {length: this.length},
            () => Math.random() < this.value_distribution);
    }
}

export class Mutator
{
    constructor(bit_mutation_rate)
    {
        this.bit_mutation_rate = bit_mutation_rate;
    }

    apply(value)
    {
        value.forEach((v, i, a) =>
        {
            if (Math.random() < this.bit_mutation_rate)
            {
                a[i] = !a[i];
            }
        });
    }
}

export class Crossover
{
    constructor(min_crossover_points,
                max_crossover_points=undefined)
    {
        this.min_crossover_points = min_crossover_points;
        this.max_crossover_points = max_crossover_points || min_crossover_points;
    }

    apply(a, b)
    {
        const num_points = get_random_int_inclusive(
            this.min_crossover_points, this.max_crossover_points);



    }
}
