import numpy as np
import random
import sys

import jssp.types

def apply_local_search(problem, operations, tabu_list=None, steepest=True):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)

    job_allocations     = [None for _ in range(problem.job_count)]
    machine_allocations = [None for _ in range(problem.machine_count)]

    remaining_operations = list(operations)

    while remaining_operations:
        operation       = next(operation for operation in remaining_operations if operation.job_sequence_index == job_sequence_indexes[operation.job])
        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps

        allocation = jssp.types.Allocation(
            None, None, start_time,
            job_allocations[operation.job] if job_completion_times[operation.job] >= machine_completion_times[operation.machine] else None,
            machine_allocations[operation.machine] if machine_completion_times[operation.machine] >= job_completion_times[operation.job] else None,
            operation)

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        job_allocations[operation.job]         = allocation
        machine_allocations[operation.machine] = allocation

        job_sequence_index = job_sequence_indexes[operation.job]
        job_sequence_indexes[operation.job] += 1

        remaining_operations.remove(operation)

    makespan = max(machine_completion_times)

    heads = [(machine_allocation, True)
             for machine_allocation in machine_allocations
             if machine_allocation.start_time + machine_allocation.operation.time_steps == makespan]

    swappable = []

    previous        = None
    right_edge      = None
    right_swappable = None

    head = heads.pop()

    while head:
        head_allocation, is_last_block = head

        is_first_block = not head_allocation.machine_predecessor and not head_allocation.job_predecessor

        if not previous:
            right_edge = head_allocation
        elif not head_allocation.machine_predecessor:
            if right_swappable and not is_last_block:
                swappable.append((right_swappable.operation, right_edge.operation))

            if (not is_last_block or right_swappable) and not is_first_block:
                swappable.append((head_allocation.operation, previous.operation))

            is_first_block = False
        elif previous == right_edge:
            right_swappable = head_allocation

        previous = head_allocation

        if head_allocation.job_predecessor:
            heads.append((head_allocation.job_predecessor, False))

        if head_allocation.machine_predecessor:
            head = (head_allocation.machine_predecessor, False)
        elif heads:
            head            = heads.pop()
            previous        = None
            right_swappable = None
            right_edge      = None
        else:
            head = None

    best_solution      = jssp.types.Solution(operations, makespan)
    swapped_operations = None

    for first_operation, second_operation in set(swappable) if steepest else [random.choice(swappable)]:
        first_index  = operations.index(first_operation)
        second_index = operations.index(second_operation)

        swap_operation_indexes = sorted([first_operation.index, second_operation.index])

        if tabu_list and swap_operation_indexes in tabu_list:
            continue

        modified = list(operations)
        modified[first_index], modified[second_index] = modified[second_index], modified[first_index]
        makespan = compute_makespan(problem, modified)

        if makespan < best_solution.makespan:
            best_solution = jssp.types.Solution(modified, makespan)
            swapped_operations = swap_operation_indexes

    return best_solution, swapped_operations

def compute_makespan(problem, input_sequence, output_sequence=None):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)

    remaining_operations = list(input_sequence)

    while remaining_operations:
        operation  = next(operation
                          for operation in remaining_operations
                          if operation.job_sequence_index == job_sequence_indexes[operation.job])

        if output_sequence is not None:
            output_sequence.append(operation)

        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        job_sequence_index = job_sequence_indexes[operation.job]
        job_sequence_indexes[operation.job] += 1

        remaining_operations.remove(operation)

    return max(machine_completion_times)

def develop_schedule(problem, preference, reorder=None, output_sequence=None):
    def compute_earliest_start_time(operation):
        return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

    def compute_earliest_completion_time(operation):
        return compute_earliest_start_time(operation) + operation.time_steps

    def get_preferred_conflict_operation(conflict_set):
        for preferred_job in preference[earliest_operation.machine]:
            for conflict_operation in conflict_set:
                if not reorder or not reorder.after or conflict_operation is not reorder.operation:
                    if preferred_job == conflict_operation.job:
                        return conflict_operation

    schedule    = np.full((problem.machine_count, problem.job_count), -1, int)
    allocations = [[] for _ in range(problem.machine_count)]
    possible    = [operation_sequence[0] for operation_sequence in problem.jobs]

    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    job_allocations     = [None for _ in range(problem.job_count)]
    machine_allocations = [None for _ in range(problem.machine_count)]

    while possible:
        earliest_completion_time, earliest_operation = \
            min((compute_earliest_completion_time(operation), operation) for operation in possible)

        conflict_set = [operation for operation in possible
                        if operation.machine == earliest_operation.machine and
                        compute_earliest_start_time(operation) < earliest_completion_time]

        if (reorder and reorder.machine == earliest_operation.machine and
            ((not reorder.after and
              reorder.machine_sequence_edge <= machine_sequence_indexes[earliest_operation.machine] and
              machine_sequence_indexes[earliest_operation.machine] <= reorder.machine_sequence_index and
              reorder.operation in conflict_set) or
             (reorder.after and
              (machine_sequence_indexes[earliest_operation.machine] == reorder.machine_sequence_edge or
               (len(conflict_set) == 1 and reorder.operation in conflict_set))))):
            selected_operation = reorder.operation
            reorder            = None
        else:
            selected_operation = get_preferred_conflict_operation(conflict_set)

        if not selected_operation:
            print("WTF")
            print(preference)

        if output_sequence is not None:
            output_sequence.append(selected_operation)

        predecessor = (machine_allocations[selected_operation.machine]
            if machine_completion_times[selected_operation.machine] >= job_completion_times[selected_operation.job]
            else job_allocations[selected_operation.job])

        job_sequence_index = job_sequence_indexes[selected_operation.job]
        job_sequence_indexes[selected_operation.job] += 1

        machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
        machine_sequence_indexes[selected_operation.machine] += 1

        operation_start_time      = compute_earliest_start_time(selected_operation)
        operation_completion_time = operation_start_time + selected_operation.time_steps

        schedule[selected_operation.machine, machine_sequence_index] = selected_operation.job

        allocation = jssp.types.Allocation(
            job_sequence_index,
            machine_sequence_index,
            operation_start_time,
            job_allocations[selected_operation.job] if job_completion_times[selected_operation.job] >= machine_completion_times[selected_operation.machine] else None,
            machine_allocations[selected_operation.machine] if machine_completion_times[selected_operation.machine] >= job_completion_times[selected_operation.job] else None,
            selected_operation)

        allocations[selected_operation.machine].append(allocation)

        job_completion_times[selected_operation.job]         = operation_completion_time
        machine_completion_times[selected_operation.machine] = operation_completion_time

        job_allocations[selected_operation.job]         = allocation
        machine_allocations[selected_operation.machine] = allocation

        if selected_operation in possible:
            possible.remove(selected_operation)

        if job_sequence_index < problem.machine_count - 1:
            possible.append(problem.jobs[selected_operation.job][job_sequence_index + 1])

    makespan = max(machine_completion_times)

    return schedule, allocations, makespan

def find_reorderings(problem, allocations):
    head = max((machine_allocation[-1] for machine_allocation in allocations),
               key=lambda allocation: allocation.start_time + allocation.operation.time_steps)

    reorderings  = []
    centerpieces = []

    left_edge  = None
    right_edge = None
    previous   = None

    while head:
        if not previous or head.operation.machine != previous.operation.machine:
            right_edge = head
            centerpieces.clear()
        elif not head.job_predecessor or head.operation.machine != head.job_predecessor.operation.machine:
            left_edge = head

            for centerpiece in centerpieces:
                reorderings.append(jssp.types.Reorder(
                    centerpiece.operation.machine, left_edge.machine_sequence_index, centerpiece.machine_sequence_index, centerpiece.operation, False))
                reorderings.append(jssp.types.Reorder(
                    centerpiece.operation.machine, right_edge.machine_sequence_index, centerpiece.machine_sequence_index, centerpiece.operation, True))
        else:
            centerpieces.append(head)

        previous = head
        head     = head.job_predecessor

    return reorderings

def generate_random_solution(problem):
    random_operation_sequence = [
        operation for operation_sequence in problem.jobs for operation in operation_sequence]
    random.shuffle(random_operation_sequence)

    fixed_operation_sequence = []
    makespan = compute_makespan(problem, random_operation_sequence, fixed_operation_sequence)
    return jssp.types.Solution(fixed_operation_sequence, makespan)

def get_allocations(problem, operations):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    job_allocations     = [None for _ in range(problem.job_count)]
    machine_allocations = [None for _ in range(problem.machine_count)]

    allocations = [[] for _ in range(problem.machine_count)]

    remaining_operations = list(operations)

    while remaining_operations:
        operation       = next(operation for operation in remaining_operations if operation.job_sequence_index == job_sequence_indexes[operation.job])
        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps

        job_sequence_index = job_sequence_indexes[operation.job]
        job_sequence_indexes[operation.job] += 1

        machine_sequence_index = machine_sequence_indexes[operation.machine]
        machine_sequence_indexes[operation.machine] += 1

        allocation = jssp.types.Allocation(
            job_sequence_index, machine_sequence_index, start_time,
            job_allocations[operation.machine] if job_completion_times[operation.job] > machine_completion_times[operation.machine] else None,
            machine_allocations[operation.machine] if machine_completion_times[operation.machine] > job_completion_times[operation.job] else None,
            operation)

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        allocations[operation.machine].append(allocation)

        job_allocations[operation.job]         = allocation
        machine_allocations[operation.machine] = allocation

        remaining_operations.remove(operation)

    return allocations

def repair_operations_sequence(problem, operation_sequence):
    input_sequence  = list(operation_sequence)
    output_sequence = []

    job_sequence_indexes = np.zeros(problem.job_count, int)

    while input_sequence:
        operation = next(operation
                         for operation in input_sequence
                         if operation.job_sequence_index == job_sequence_indexes[operation.job])

        job_sequence_index = job_sequence_indexes[operation.job]
        job_sequence_indexes[operation.job] += 1

        output_sequence.append(operation)
        input_sequence.remove(operation)

    return output_sequence

def tabu_search(problem, solution, iterations, tenure):
    tabu_list = []

    for _ in range(iterations):
        candidate, swap = apply_local_search(problem, solution.operations, tabu_list, steepest=False)

        if swap and candidate.makespan <= solution.makespan:
            solution = candidate

            if len(tabu_list) > tenure:
                tabu_list.pop(0)

            if tenure > 0:
                tabu_list.append(swap)

    return solution