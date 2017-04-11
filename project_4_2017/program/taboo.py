#!/usr/bin/env python3

import numpy as np
import random
import sys

import jssp.io
import jssp.types

def evaluate_schedule(problem, partial_schedule, focus_operation):
    job_completion_times        = np.zeros(problem.job_count)
    machine_completion_times    = np.zeros(problem.machine_count)
    job_sequence_indexes        = np.full(problem.job_count, -1, int)
    machine_sequence_indexes    = np.zeros(problem.machine_count, int)
    machine_sequence_completion = np.full(problem.machine_count, False, bool)

    reached_focus = False

    print(partial_schedule)

    # Gotta schedule and process as queue

    while True:
        progress = False

        for machine_index, machine_schedule in enumerate(partial_schedule):
            machine_sequence_index = machine_sequence_indexes[machine_index]

            if machine_sequence_index == len(machine_schedule):
                machine_sequence_completion[machine_index] = True
                continue

            operation = machine_schedule[machine_sequence_index]

            print(operation)

            if job_sequence_indexes[operation.job] < operation.job_sequence_index:
                start_time = max(job_completion_times[operation.job], machine_completion_times[operation.machine])

                print('scheduled!')

                if not reached_focus or start_time > 0:
                    completion_time = start_time + operation.time_steps

                    if operation is focus_operation:
                        job_completion_times[:]     = 0
                        machine_completion_times[:] = 0
                        reached_focus = True

                    job_completion_times[operation.job]         = completion_time
                    machine_completion_times[operation.machine] = completion_time

                machine_sequence_indexes[operation.machine] += 1
                job_sequence_indexes[operation.job] = operation.job_sequence_index
                progress = True

        print(machine_sequence_completion)
        if np.all(machine_sequence_completion):
            return machine_completion_times.max()
        elif not progress:
            return None

problem = jssp.io.parse_problem_file(sys.argv[1])

# Step 0

jobs_summed_processing_times = [(job, sum(operation.time_steps for operation in job)) for job in problem.jobs]
jobs_summed_processing_times.sort(key=(lambda x: x[1]), reverse=True)
max_processing_time_sum = jobs_summed_processing_times[0][1]
jobs_with_max_processing_time = [
    job for job, summed_processing_time in jobs_summed_processing_times if summed_processing_time == max_processing_time_sum]

initial_job = random.choice(jobs_with_max_processing_time)

schedule = [[] for _ in range(problem.machine_count)]

for operation in initial_job:
    schedule[operation.machine].append(operation)

# Step 1

remaining_operations = [operation for job in problem.jobs if job is not initial_job for operation in job]
random.shuffle(remaining_operations)
remaining_operations.sort(key=(lambda operation: operation.time_steps), reverse=True)

# Step 2
for operation in remaining_operations:
    # Step 3

    for insertion_point in range(len(schedule[operation.machine]) + 1):
        partial_schedule = [list(machine_schedule) for machine_schedule in schedule]
        partial_schedule[operation.machine].insert(insertion_point, operation)

        print(evaluate_schedule(problem, partial_schedule, operation))

    break