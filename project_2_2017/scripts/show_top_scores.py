#!/usr/bin/env python3

import os
import re
from statistics import mean

from collections import defaultdict

filename_pattern  = re.compile('^grid-search-result-instance-(?P<instance>\d+)-(?P<parameters>.+)-run-(?P<run>\d+).txt$')

(top_root,      _, top_file_names)      = next(os.walk('../data/top'))
(solution_root, _, solution_file_names) = next(os.walk('../assignment/data/solutions'))

for top_file_name in top_file_names:
    if top_file_name in solution_file_names:
        with open(os.path.join(top_root, top_file_name)) as f:
            top_score = float(f.readline())
        with open(os.path.join(solution_root, top_file_name)) as f:
            solution_score = float(f.readline())
        print('{} {}'.format(top_file_name, (100.0 * top_score / solution_score) - 100.0))
