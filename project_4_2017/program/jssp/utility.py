import numpy as np

import jssp.types

def apply_local_search(problem, operations, tabu_list=None):
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

    for first_operation, second_operation in set(swappable):
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

def compute_makespan(problem, operations):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)

    remaining_operations = list(operations)

    while remaining_operations:
        operation  = next(operation for operation in remaining_operations if operation.job_sequence_index == job_sequence_indexes[operation.job])
        start_time = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps
        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        job_sequence_index = job_sequence_indexes[operation.job]
        job_sequence_indexes[operation.job] += 1

        remaining_operations.remove(operation)

    return max(machine_completion_times)

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

def tabu_search(problem, solution, iterations, tenure):
    tabu_list = []

    for _ in range(iterations):
        candidate, swap = apply_local_search(problem, solution.operations, tabu_list)

        if candidate is not solution:
            if candidate.makespan <= solution.makespan:
                solution = candidate

                if len(tabu_list) >= tenure:
                    tabu_list.pop(0)

                tabu_list.append(swap)

    return solution