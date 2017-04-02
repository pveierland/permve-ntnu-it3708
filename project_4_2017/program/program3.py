#!/usr/bin/env python3

from collections import namedtuple
import math
import matplotlib.animation as animation
import matplotlib.pyplot as plt
import random
import statistics
import sys

import numpy as np

Allocation = namedtuple('Allocation', ['job_index', 'sequence_index', 'start_time', 'time_steps'])
Operation  = namedtuple('Operation', ['job_index', 'machine_index', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])

def allocate_operation_sequence(problem, operation_sequence):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    sequence_indexes         = np.zeros(problem.job_count, int)

    allocations = [[] for _ in range(problem.machine_count)]

    for operation in operation_sequence:
        operation_start_time = max(job_completion_times[operation.job_index],
                                   machine_completion_times[operation.machine_index])

        operation_completion_time = operation_start_time + operation.time_steps

        job_completion_times[operation.job_index]         = operation_completion_time
        machine_completion_times[operation.machine_index] = operation_completion_time

        allocations[operation.machine_index].append(
            Allocation(operation.job_index,
                       sequence_indexes[operation.job_index],
                       operation_start_time,
                       operation.time_steps))

        sequence_indexes[operation.job_index] += 1

    return allocations, max(machine_completion_times)

def decode_random_key_operation_sequence(problem, random_key):
    ranks = np.empty(problem.job_count * problem.machine_count, int)
    ranks[random_key.argsort()] = np.arange(problem.job_count * problem.machine_count)

    job_indexes        = (ranks + 1) % problem.job_count
    sequence_indexes   = np.zeros(problem.job_count, int)
    operation_sequence = []

    for job_index in job_indexes:
        sequence_index = sequence_indexes[job_index]
        sequence_indexes[job_index] += 1

        operation = problem.jobs[job_index][sequence_index]
        operation_sequence.append(operation)

    return operation_sequence

def individual_enchancement_insert(sequence):
    original        = sequence.copy()
    sequence_length = len(original)
    source          = random.randrange(sequence_length)
    target          = random.randrange(sequence_length)
    value           = original[source]

    if target < source:
        sequence[target+1:source+1] = original[target:source]
    else:
        sequence[source:target] = original[source+1:target+1]

    sequence[target] = value

def individual_enchancement_invert(sequence):
    sequence_length      = len(sequence)
    first                = random.randrange(sequence_length)
    second               = random.randrange(sequence_length)
    low, high            = min(first, second), max(first, second)
    sequence[low:high+1] = np.flipud(sequence[low:high+1])

def individual_enchancement_move(sequence):
    original = sequence.copy()
    values   = sorted(random.sample(range(len(original)), 3))

    if random.random() < 0.5:
        target, low, high = values
    else:
        low, high, target = values

    length = high - low + 1

    if target < low:
        sequence[target+length:high+1] = original[target:low]
        sequence[target:target+length] = original[low:high+1]
    else:
        sequence[low:target-length+1]      = original[high+1:target+1]
        sequence[target-length+1:target+1] = original[low:high+1]

def individual_enchancement_swap(sequence):
    sequence_length = len(sequence)
    first           = random.randrange(sequence_length)
    second          = random.randrange(sequence_length)
    sequence[first], sequence[second] = sequence[second], sequence[first]

def parse_problem_file(filename):
    with open(filename) as input_file:
        input_lines = input_file.readlines()
        job_count, machine_count = map(int, input_lines[0].split())
        jobs = []

        for job_index in range(job_count):
            input_line = list(map(int, input_lines[job_index + 1].split()))
            jobs.append([Operation(job_index, machine_index, time_steps)
                         for machine_index, time_steps in zip(input_line[0::2], input_line[1::2])])

        return Problem(job_count, machine_count, jobs)

#problem = parse_problem_file(sys.argv[1])
problem = Problem(3, 2, [])

s = np.array([1.3, 0.7, 2.4, 1.1, 3.4, 5.3])

print(decode_random_key_operation_sequence(problem, s))