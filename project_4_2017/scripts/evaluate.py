#!/usr/bin/env python3

import multiprocessing
import numpy as np
import os
import re
import subprocess
import sys

class colors:
    HEADER    = '\033[95m'
    OKBLUE    = '\033[94m'
    OKGREEN   = '\033[92m'
    WARNING   = '\033[93m'
    FAIL      = '\033[91m'
    ENDC      = '\033[0m'
    BOLD      = '\033[1m'
    UNDERLINE = '\033[4m'

def run_program(optimizer, problem_file):
    try:
        result = subprocess.run(
            ['python3', str(os.path.join(os.path.dirname(__file__), '../program/program.py')), '--optimizer', optimizer, '--problem', problem_file, '--script'],
            stdout=subprocess.PIPE)
    except:
        print("failed to run optimizer '{}' with problem '{}'".format(
            optimizer, problem_file), file=sys.stderr)
        sys.exit(-1)

    return float(result.stdout.decode('utf-8').strip())

problem_file_path = '../assignment/Test Data/'

makespan_baseline = {
    '1.txt': 55.0,
    '2.txt': 930.0,
    '3.txt': 1165.0,
    '4.txt': 1005.0,
    '5.txt': 1235.0,
    '6.txt': 943.0
}

problem_files = sorted(
    filter(lambda filename: re.match('\d+\.txt', filename),
           os.listdir(problem_file_path)))

pool = multiprocessing.Pool(1)#multiprocessing.cpu_count())

run_count = 5

optimizers = ['aco', 'ba', 'pso']

makespan_values = np.zeros((len(optimizers), len(problem_files), run_count))

evaluations = [
    (optimizer_index, problem_index, run_index, pool.apply_async(run_program, (optimizer, os.path.join(problem_file_path, problem_file))))
    for problem_index, problem_file in enumerate(problem_files)
    for optimizer_index, optimizer in enumerate(optimizers)
    for run_index in range(run_count)]

for evaluation_index, evaluation in enumerate(evaluations):
    optimizer_index, problem_index, run_index, result = evaluation
    makespan = result.get()
    makespan_values[optimizer_index, problem_index, run_index] = makespan
    print('{:.2f}%'.format(100 * (evaluation_index + 1) / len(evaluations)))

pool.close()
pool.join()

def format_makespan(name, value, baseline):
    color = '' if not baseline else colors.OKGREEN if value <= (baseline * 1.1) else colors.FAIL
    return '{}{:>6.1f} {:>5.1f}% ({}){}'.format(
        color, value, 100 * value / baseline, name, colors.ENDC)

for optimizer_index in range(len(optimizers)):
    print(optimizers[optimizer_index])

    for problem_index, problem_file in enumerate(problem_files):
        baseline      = makespan_baseline[problem_file]
        min_makespan  = np.min(makespan_values[optimizer_index, problem_index])
        mean_makespan = np.mean(makespan_values[optimizer_index, problem_index])

        print('{}: {} {} {:>6.1f} (baseline)'.format(
            problem_file,
            format_makespan('min',  min_makespan,  baseline),
            format_makespan('mean', mean_makespan, baseline),
            baseline))
