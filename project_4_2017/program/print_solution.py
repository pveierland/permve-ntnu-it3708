#!/usr/bin/env python3

import pickle
import sys

import jssp.types

solution = pickle.load(open(sys.argv[1], 'rb'))

print(solution.makespan)