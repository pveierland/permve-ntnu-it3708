import * as benchmark from './benchmark';

let options = benchmark.getDefaultOptions();

benchmark.runPerformanceTest(options, 'static', 1, 60, true, 'flatland_static_1.txt');

