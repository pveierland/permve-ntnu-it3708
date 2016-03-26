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

        this.population = this.createInitialPopulation();
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
        let artifacts      = this.parentSelectionStrategy.prepare(this.population);
        let parentSelector = generator.parent(this.population, artifacts, this.parentSelectionStrategy);
        let childGenerator = generator.child(
            parentSelector, this.reproductionStrategy, this.developmentStrategy, this.fitnessEvaluationStrategy);
        this.population    = this.adultSelectionStrategy.select(this.population, childGenerator);
    }

    stats()
    {
        const fitnessValues  = this.population.map(v => v.fitness);
        const fitnessMean    = math.mean(fitnessValues);
        const fitnessPStdDev = math.std(fitnessValues, 'uncorrected');

        const bestIndividual = this.population.reduce(
            (pv, cv) => pv && pv.fitness > cv.fitness ? pv : cv, null);

        return {
            fitnessMean:    fitnessMean,
            fitnessPStdDev: fitnessPStdDev,
            bestIndividual: bestIndividual };
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
                    ? developmentStrategy(childGenotype)
                    : childGenotype);

                if (childPhenotype)
                {
                    let childFitness = fitnessEvaluationStrategy.evaluate(childPhenotype);

                    if (childFitness)
                    {
                        yield new Individual(childGenotype, childPhenotype, childFitness);
                    }
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

                if (fitness)
                {
                    yield new Individual(genotype, phenotype, fitness);
                }
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
