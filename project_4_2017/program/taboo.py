#!/usr/bin/env python3

import numpy as np
import queue
import random
import sys

import jssp.io
import jssp.types

def evaluate_longest_path(problem, partial_schedule, focus_operation):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_focus_times          = np.zeros(problem.job_count)
    machine_focus_times      = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    reached_focus = False

    allocations = [[] for _ in range(problem.machine_count)]

    machine_frontier = [machine_schedule[0].index for machine_schedule in partial_schedule if machine_schedule]

    job_schedules = [[] for _ in range(problem.job_count)]

    for machine_sequence in partial_schedule:
        for operation in machine_sequence:
            job_schedules[operation.job].append(operation)

    for job_schedule in job_schedules:
        job_schedule.sort(key=lambda operation: operation.job_sequence_index)

    job_frontier = [job_schedule[0].index for job_schedule in job_schedules if job_schedule]

    while True:
        for operation_index in machine_frontier:
            if operation_index in job_frontier:
                break
        else:
            break

        operation = problem.operations[operation_index]
        machine_frontier.remove(operation_index)
        job_frontier.remove(operation_index)

        start_time = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps
        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        allocations[operation.machine].append(jssp.types.Allocation(
            operation.job_sequence_index,
            machine_sequence_indexes[operation.machine],
            start_time, None, None, operation))

        focus_start_time = max(job_focus_times[operation.job], machine_focus_times[operation.machine])

        if not reached_focus or start_time > 0:
            focus_completion_time = start_time + operation.time_steps

            if operation is focus_operation:
                job_focus_times[:]     = 0
                machine_focus_times[:] = 0
                reached_focus = True

            job_focus_times[operation.job]         = focus_completion_time
            machine_focus_times[operation.machine] = focus_completion_time

        machine_sequence_indexes[operation.machine] += 1
        job_sequence_indexes[operation.job]         += 1

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < len(partial_schedule[operation.machine]):
            machine_frontier.append(partial_schedule[operation.machine][next_machine_sequence_index].index)

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < len(job_schedules[operation.job]):
            job_frontier.append(job_schedules[operation.job][next_job_sequence_index].index)

    if machine_frontier or job_frontier:
        return None
    else:
        result = machine_focus_times.max()
        return result

def find_neighborhood_moves(problem, allocations):
    makespan = max(machine_allocation[-1].start_time + machine_allocation[-1].operation.time_steps
                   for machine_allocation in allocations)

    head = random.choice(list(machine_allocation[-1]
        for machine_allocation in allocations
        if machine_allocation[-1].start_time + machine_allocation[-1].operation.time_steps == makespan))

    moves = []

    is_last_block  = True
    left_edge      = None
    right_edge     = None
    right_adjacent = None
    previous       = None

    while head:
        is_first_block = not head.machine_predecessor and not head.job_predecessor

        if not previous:
            right_edge = head
        elif not head.machine_predecessor:
            left_edge = head

            if not is_last_block:
                moves.append(((right_adjacent if right_adjacent else left_edge).operation.index, right_edge.operation.index))

            if not is_first_block and right_adjacent:
                moves.append((left_edge.operation.index, previous.operation.index))
        elif previous == right_edge:
            right_adjacent = head

        previous = head

        if head.machine_predecessor and (not head.job_predecessor or random.random() < 0.5):
            head = head.machine_predecessor
        else:
            head = head.job_predecessor
            is_last_block  = False
            right_edge     = None
            right_adjacent = None
            previous       = None

    return moves

def generate_schedule_insertion_algorithm(problem):
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
    operations = [operation for job in problem.jobs if job is not initial_job for operation in job]
    random.shuffle(operations)
    operations.sort(key=(lambda operation: operation.time_steps), reverse=True)

    # Step 2
    for operation in operations:
        best_focus_distance     = float('inf')
        best_insertion_schedule = None

        # Step 3
        for insertion_point in range(len(schedule[operation.machine]) + 1):
            partial_schedule = [list(machine_schedule) for machine_schedule in schedule]
            partial_schedule[operation.machine].insert(insertion_point, operation)

            focus_distance = evaluate_longest_path(problem, partial_schedule, operation)

            if focus_distance is not None and focus_distance < best_focus_distance:
                best_insertion_schedule = partial_schedule

        schedule = best_insertion_schedule

    return schedule

def get_allocations(problem, schedule):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    allocations         = [[] for _ in range(problem.machine_count)]
    job_allocations     = [None for _ in range(problem.job_count)]
    machine_allocations = [None for _ in range(problem.machine_count)]

    machine_frontier = [machine_schedule[0].index for machine_schedule in schedule if machine_schedule]
    job_frontier     = [job_index * problem.machine_count for job_index in range(problem.job_count)]

    while True:
        for operation_index in machine_frontier:
            if operation_index in job_frontier:
                break
        else:
            break

        operation = problem.operations[operation_index]
        machine_frontier.remove(operation_index)
        job_frontier.remove(operation_index)

        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps

        job_predecessor     = (job_allocations[operation.job] if job_completion_times[operation.job] == start_time else None)
        machine_predecessor = (machine_allocations[operation.machine] if machine_completion_times[operation.machine] == start_time else None)

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        allocation = jssp.types.Allocation(
            operation.job_sequence_index,
            machine_sequence_indexes[operation.machine],
            start_time,
            job_predecessor,
            machine_predecessor,
            operation)

        allocations[operation.machine].append(allocation)

        job_allocations[operation.job]         = allocation
        machine_allocations[operation.machine] = allocation

        machine_sequence_indexes[operation.machine] += 1
        job_sequence_indexes[operation.job]         += 1

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < problem.job_count:
            machine_frontier.append(schedule[operation.machine][next_machine_sequence_index].index)

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < problem.machine_count:
            job_frontier.append(operation.job * problem.machine_count + next_job_sequence_index)

    if not (machine_frontier or job_frontier):
        return allocations
    else:
        return None

problem     = jssp.io.parse_problem_file(sys.argv[1])
schedule    = generate_schedule_insertion_algorithm(problem)
allocations = get_allocations(problem, schedule)
moves       = find_neighborhood_moves(problem, allocations)

#jssp.io.render_gantt_chart('gantt.pdf', allocations)

# for move in moves:
#     print('{} VS {}'.format(problem.operations[move[0]], problem.operations[move[1]]))
