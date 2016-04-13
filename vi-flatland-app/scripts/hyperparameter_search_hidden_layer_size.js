import * as benchmark from './benchmark';
import * as fs from 'fs';

let options      = benchmark.getDefaultOptions();
let fileContents = '';

const scenarioCount     = 10;
const scenarioTimeSteps = 60;

// Normalization constant
const n = 1 / scenarioCount / scenarioTimeSteps;

for (let hiddenLayerSize = 1; hiddenLayerSize <= 20; hiddenLayerSize++)
{
    console.log(`hiddenLayerSize = ${hiddenLayerSize}`);
    options.development.hiddenLayer.size = hiddenLayerSize;

    const stats = benchmark.runPerformanceTest(options, 'dynamic', scenarioCount, scenarioTimeSteps);
    const text = `${hiddenLayerSize} ${stats.fitnessMean * n} ${stats.fitnessPStdDev * n} ${stats.bestIndividual.fitness * n} ${stats.diversity}`;

    fileContents += text + '\n';
    console.log(text);
}

fs.writeFileSync('hyperparameter_hidden_layer_size.txt', fileContents);
