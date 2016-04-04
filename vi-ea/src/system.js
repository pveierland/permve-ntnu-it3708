import * as math from 'mathjs';

export class Individual
{
    constructor(genotype, phenotype, fitness)
    {
        this.genotype  = genotype;
        this.phenotype = phenotype;
        this.fitness   = fitness;
    }
}

export class System
{
    constructor(options)
    {
        this.populationSize            = options.populationSize;
        this.elitismCount              = options.elitismCount;
        this.genotypeCreationStrategy  = options.genotypeCreationStrategy;
        this.parentSelectionStrategy   = options.parentSelectionStrategy;
        this.adultSelectionStrategy    = options.adultSelectionStrategy;
        this.reproductionStrategy      = options.reproductionStrategy;
        this.fitnessEvaluationStrategy = options.fitnessEvaluationStrategy;
        this.developmentStrategy       = options.developmentStrategy || null;
        this.diversityStrategy         = options.diversityStrategy || null;

        this.population = this.createInitialPopulation();
        this.generation = 0;

        console.log(options);
    }

    createInitialPopulation()
    {
        let population = new Array(this.populationSize);

        let individualGenerator = generator.individual(
            this.genotypeCreationStrategy, this.fitnessEvaluationStrategy, this.developmentStrategy);

        for (let i = 0; i != this.populationSize; i++)
        {
            population[i] = individualGenerator.next().value;
        }

        return population;
    }

    evolve()
    {
        let elitists = null;

        if (this.elitismCount)
        {
            this.population.sort((a, b) => b.fitness - a.fitness);
            elitists = this.population.splice(0, this.elitismCount);
        }

        const artifacts      = this.parentSelectionStrategy.prepare(this.population);
        const parentSelector = generator.parent(this.population, artifacts, this.parentSelectionStrategy);
        const childGenerator = generator.child(
            parentSelector, this.reproductionStrategy, this.developmentStrategy, this.fitnessEvaluationStrategy);

        const nextGeneration = this.adultSelectionStrategy.select(this.population, childGenerator);
        this.population      = elitists ? elitists.concat(nextGeneration) : nextGeneration;

        this.generation++;
    }

    stats()
    {
        let stats = {};

        stats.generation = this.generation;

        stats.fitnessValues  = this.population.map(v => v.fitness);
        stats.fitnessMean    = math.mean(stats.fitnessValues);
        stats.fitnessPStdDev = math.std(stats.fitnessValues, 'uncorrected');

        stats.bestIndividual = this.population.reduce(
            (pv, cv) => pv && pv.fitness > cv.fitness ? pv : cv, null);

        if (this.diversityStrategy)
        {
            stats.diversity = this.diversityStrategy.evaluate(this.population);
        }

        return stats;
    }
}

const generator = Object.freeze(function()
{
    let g = {};

    g.child = function*(
        parentSelector, reproductionStrategy, developmentStrategy, fitnessEvaluationStrategy)
    {
        while (true)
        {
            const childrenGenotypes = reproductionStrategy.reproduce(parentSelector);

            for (const childGenotype of childrenGenotypes)
            {
                const childPhenotype = (developmentStrategy
                    ? developmentStrategy.develop(childGenotype)
                    : childGenotype);

                if (childPhenotype)
                {
                    let childFitness = fitnessEvaluationStrategy.evaluate(childPhenotype);
                    yield new Individual(childGenotype, childPhenotype, childFitness);
                }
            }
        }
    };

    g.individual = function*(
        genotypeCreationStrategy, fitnessEvaluationStrategy, developmentStrategy = null)
    {
        while (true)
        {
            let genotype  = genotypeCreationStrategy.create();
            let phenotype = (developmentStrategy
                ? developmentStrategy.develop(genotype) : genotype);

            if (phenotype)
            {
                let fitness = fitnessEvaluationStrategy.evaluate(phenotype);
                yield new Individual(genotype, phenotype, fitness);
            }
        }
    };

    g.parent = function*(population, artifacts, parentSelectionStrategy)
    {
        while (true)
        {
            yield parentSelectionStrategy.select(population, artifacts);
        }
    };

    return g;
}());
