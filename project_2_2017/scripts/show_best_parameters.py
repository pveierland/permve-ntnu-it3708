#!/usr/bin/env python3

import os
import re
from statistics import mean

from collections import defaultdict

filename_pattern  = re.compile('^grid-search-result-instance-(?P<instance>\d+)-(?P<parameters>.+)-run-(?P<run>\d+).txt$')
(root, _, filenames) = next(os.walk('../data/'))

#map instances to parameters to list of results

results = defaultdict(lambda: defaultdict(list))

for filename in filenames:
    match = filename_pattern.match(filename)

    if match:
        try:
            with open(os.path.join(root, filename)) as f:
                value = float(f.read())
        except:
            continue
            #print(filename)

        results[match.group('instance')][match.group('parameters')].append(value)

for instance, parameter_values in results.items():
    print('instance: {}'.format(instance))
    for parameters, value in sorted([(parameters, mean(values)) for parameters, values in parameter_values.items()], key=(lambda x: x[1]))[:3]:
        print('{} {}'.format(parameters, value))
    print()
