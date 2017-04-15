from collections import deque, namedtuple
import numpy as np
import random
import sys

import jssp.types

def apply_move(problem, schedule, move):
    modified_machine_index = problem.operations[move[0]].machine

    modified_schedule = [list(machine_schedule)
                         if machine_index == modified_machine_index else machine_schedule
                         for machine_index, machine_schedule in enumerate(schedule)]

    modified_machine_schedule = modified_schedule[modified_machine_index]

    first_index  = next(i for i, operation in enumerate(modified_machine_schedule) if operation.index == move[0])
    second_index = next(i for i, operation in enumerate(modified_machine_schedule) if operation.index == move[1])

    modified_machine_schedule[first_index], modified_machine_schedule[second_index] = \
        modified_machine_schedule[second_index], modified_machine_schedule[first_index]

    return modified_schedule

def compute_allocations(problem, schedule):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    allocations         = [[] for _ in range(problem.machine_count)]
    job_allocations     = [None for _ in range(problem.job_count)]
    machine_allocations = [None for _ in range(problem.machine_count)]

    job_frontier     = [job_index * problem.machine_count for job_index in range(problem.job_count)]
    machine_frontier = [machine_schedule[0].index for machine_schedule in schedule if machine_schedule]

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

        job_predecessor = (job_allocations[operation.job]
            if job_completion_times[operation.job] == start_time else None)

        machine_predecessor = (machine_allocations[operation.machine]
            if machine_completion_times[operation.machine] == start_time else None)

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

        job_sequence_indexes[operation.job]         += 1
        machine_sequence_indexes[operation.machine] += 1

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < problem.machine_count:
            job_frontier.append(operation.job * problem.machine_count + next_job_sequence_index)

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < problem.job_count:
            machine_frontier.append(schedule[operation.machine][next_machine_sequence_index].index)

    if not job_frontier and not machine_frontier:
        return allocations, job_completion_times.max()
    else:
        return None

def compute_makespan(problem, schedule):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    job_frontier     = [job_index * problem.machine_count for job_index in range(problem.job_count)]
    machine_frontier = [machine_schedule[0].index for machine_schedule in schedule if machine_schedule]

    while True:
        for operation_index in machine_frontier:
            if operation_index in job_frontier:
                break
        else:
            break

        operation = problem.operations[operation_index]
        job_frontier.remove(operation_index)
        machine_frontier.remove(operation_index)

        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
        completion_time = start_time + operation.time_steps

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        job_sequence_indexes[operation.job]         += 1
        machine_sequence_indexes[operation.machine] += 1

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < problem.machine_count:
            job_frontier.append(operation.job * problem.machine_count + next_job_sequence_index)

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < problem.job_count:
            machine_frontier.append(schedule[operation.machine][next_machine_sequence_index].index)

    if not job_frontier and not machine_frontier:
        return machine_completion_times.max()
    else:
        return None

def develop_schedule(problem, preference):
    def compute_earliest_start_time(operation):
        return max(job_completion_times[operation.job], machine_completion_times[operation.machine])

    def compute_earliest_completion_time(operation):
        return compute_earliest_start_time(operation) + operation.time_steps

    def get_preferred_conflict_operation(conflict_set):
        for preferred_operation in preference[earliest_operation.machine]:
            for conflict_operation in conflict_set:
                if preferred_operation == conflict_operation:
                    return conflict_operation

    schedule    = [[None] * problem.job_count for _ in range(problem.machine_count)]
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

        selected_operation = get_preferred_conflict_operation(conflict_set)

        predecessor = (machine_allocations[selected_operation.machine]
            if machine_completion_times[selected_operation.machine] >= job_completion_times[selected_operation.job]
            else job_allocations[selected_operation.job])

        job_sequence_index = job_sequence_indexes[selected_operation.job]
        job_sequence_indexes[selected_operation.job] += 1

        machine_sequence_index = machine_sequence_indexes[selected_operation.machine]
        machine_sequence_indexes[selected_operation.machine] += 1

        operation_start_time      = compute_earliest_start_time(selected_operation)
        operation_completion_time = operation_start_time + selected_operation.time_steps

        schedule[selected_operation.machine][machine_sequence_index] = selected_operation

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

def evaluate_longest_path(problem, partial_schedule, focus_operation):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_focus_times          = np.zeros(problem.job_count)
    machine_focus_times      = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

    job_schedules = [[] for _ in range(problem.job_count)]

    for machine_sequence in partial_schedule:
        for operation in machine_sequence:
            job_schedules[operation.job].append(operation)

    for job_schedule in job_schedules:
        job_schedule.sort(key=lambda operation: operation.job_sequence_index)

    job_frontier     = [job_schedule[0].index for job_schedule in job_schedules if job_schedule]
    machine_frontier = [machine_schedule[0].index for machine_schedule in partial_schedule if machine_schedule]

    allocations   = [[] for _ in range(problem.machine_count)]
    reached_focus = False

    while True:
        for operation_index in machine_frontier:
            if operation_index in job_frontier:
                break
        else:
            break

        operation = problem.operations[operation_index]
        job_frontier.remove(operation_index)
        machine_frontier.remove(operation_index)

        start_time      = max(job_completion_times[operation.job], machine_completion_times[operation.machine])
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

        job_sequence_indexes[operation.job]         += 1
        machine_sequence_indexes[operation.machine] += 1

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < len(job_schedules[operation.job]):
            job_frontier.append(job_schedules[operation.job][next_job_sequence_index].index)

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < len(partial_schedule[operation.machine]):
            machine_frontier.append(partial_schedule[operation.machine][next_machine_sequence_index].index)

    if not job_frontier and not machine_frontier:
        return job_focus_times.max()
    else:
        # Infeasible partial schedule
        return None

def find_neighborhood_moves(problem, allocations, makespan):
    head = random.choice(list(
        machine_allocation[-1]
        for machine_allocation in allocations
        if machine_allocation[-1].start_time + machine_allocation[-1].operation.time_steps == makespan))

    moves = []

    is_last_block  = True
    left_edge      = None
    right_edge     = None
    right_adjacent = None
    previous       = None

    while head:
        if not previous:
            right_edge = head
        elif not head.machine_predecessor:
            left_edge      = head
            is_first_block = not head.machine_predecessor and not head.job_predecessor

            if not is_last_block:
                moves.append(((right_adjacent if right_adjacent else left_edge).operation.index, right_edge.operation.index))

            if not is_first_block and right_adjacent:
                moves.append((left_edge.operation.index, previous.operation.index))
        elif previous == right_edge:
            right_adjacent = head

        previous = head

        if head.machine_predecessor:# and (not head.job_predecessor or random.random() < 0.5):
            head = head.machine_predecessor
        else:
            head = head.job_predecessor
            is_last_block  = False
            right_edge     = None
            right_adjacent = None
            previous       = None

    return moves

def generate_random_solution(problem):
    schedule = [[] for _ in range(problem.machine_count)]

    for job in problem.jobs:
        for operation in job:
            schedule[operation.machine].append(operation)

    for m in range(problem.machine_count):
        random.shuffle(schedule[m])

    schedule, _, makespan = jssp.utility.develop_schedule(problem, schedule)

    return jssp.types.Solution(schedule, makespan)

def generate_schedule_insertion_algorithm(problem):
    jobs_summed_processing_times = [(job, sum(operation.time_steps for operation in job)) for job in problem.jobs]
    jobs_summed_processing_times.sort(key=(lambda x: x[1]), reverse=True)
    max_processing_time_sum = jobs_summed_processing_times[0][1]
    jobs_with_max_processing_time = [
        job for job, summed_processing_time in jobs_summed_processing_times
        if summed_processing_time == max_processing_time_sum]

    initial_job = random.choice(jobs_with_max_processing_time)

    schedule = [[] for _ in range(problem.machine_count)]

    for operation in initial_job:
        schedule[operation.machine].append(operation)

    operations = [operation for job in problem.jobs if job is not initial_job for operation in job]
    random.shuffle(operations)
    operations.sort(key=(lambda operation: operation.time_steps), reverse=True)

    for operation in operations:
        best_focus_distance     = float('inf')
        best_insertion_schedule = None

        for insertion_point in range(len(schedule[operation.machine]) + 1):
            partial_schedule = [list(machine_schedule) for machine_schedule in schedule]
            partial_schedule[operation.machine].insert(insertion_point, operation)

            focus_distance = evaluate_longest_path(problem, partial_schedule, operation)

            if focus_distance is not None and focus_distance < best_focus_distance:
                best_focus_distance     = focus_distance
                best_insertion_schedule = partial_schedule

        schedule = best_insertion_schedule

    return schedule

def invert_move(move):
    return tuple(reversed(move))

def apply_local_search(problem, schedule):
    allocations, makespan = compute_allocations(problem, schedule)
    moves = find_neighborhood_moves(problem, allocations, makespan)
    if moves:
        _, schedule, makespan = neighborhood_searching_procedure(problem, schedule, moves, makespan)
    return jssp.types.Solution(schedule, makespan)

def neighborhood_searching_procedure(problem, schedule, moves, best_known_makespan, taboo_list=None):
    best_unforbidden_or_profitable = None

    for move in moves:
        is_move_taboo = taboo_list and move in taboo_list

        move_schedule          = apply_move(problem, schedule, move)
        move_schedule_makespan = compute_makespan(problem, move_schedule)

        if not is_move_taboo or move_schedule_makespan < best_known_makespan:
            move_info = (move, move_schedule, move_schedule_makespan)
            if not best_unforbidden_or_profitable or move_schedule_makespan < best_unforbidden_or_profitable[0][2]:
                best_unforbidden_or_profitable = [move_info]
            elif move_schedule_makespan == best_unforbidden_or_profitable[0][2]:
                best_unforbidden_or_profitable.append(move_info)

    if best_unforbidden_or_profitable:
        result_move, result_schedule, result_makespan = random.choice(best_unforbidden_or_profitable)
    elif len(moves) == 1:
        result_move     = moves[0]
        result_schedule = apply_move(problem, schedule, result_move)
        result_makespan = compute_makespan(problem, result_schedule)
    else:
        while True:
            unforbidden_move = taboo_list.popleft()
            taboo_list.append(taboo_list[-1])

            if unforbidden_move in moves:
                result_move     = unforbidden_move
                result_schedule = apply_move(problem, schedule, result_move)
                result_makespan = compute_makespan(problem, result_schedule)
                break

    if taboo_list:
        taboo_list.append(invert_move(result_move))

    return result_move, result_schedule, result_makespan

TabooConfig = namedtuple('TabooConfig', [
    'total_iteration_limit',
    'iteration_limit',
    'list_limit',
    'backtracking_limit',
    'max_cycle_duration',
    'max_cycle_count'])

def taboo_search(
    problem, best_schedule, best_schedule_makespan, config):

    def is_cycle(iteration):
        for cycle_duration in range(1, config.max_cycle_duration + 1):
            for cycle_index in range(1, config.max_cycle_count + 1):
                first_index  = ((iteration - cycle_index * cycle_duration) + makespan_history.size) % makespan_history.size
                second_index = ((iteration - (cycle_index - 1) * cycle_duration) + makespan_history.size) % makespan_history.size
                if not makespan_history[first_index] or makespan_history[first_index] != makespan_history[second_index]:
                    break
            else:
                return True

        return False

    makespan_history       = np.zeros(config.max_cycle_count * config.max_cycle_duration)
    makespan_history_index = 0

    schedule          = best_schedule
    taboo_list        = deque(maxlen=config.list_limit)
    backtracking_list = deque(maxlen=config.backtracking_limit)
    iteration         = 0
    total_iterations  = 0
    save              = True
    max_iterations    = config.iteration_limit

    while True:
        cycle_detected = is_cycle(iteration)

        if cycle_detected:
            makespan_history[:] = 0

        if total_iterations > config.total_iteration_limit:
            break
        elif iteration <= max_iterations and not cycle_detected:
            iteration        += 1
            total_iterations += 1

            allocations, makespan = compute_allocations(problem, schedule)
            moves                 = find_neighborhood_moves(problem, allocations, makespan)

            if not moves:
                break
        elif backtracking_list:
            max_iterations = int(round(config.iteration_limit * (1.0 - 0.2 * (config.backtracking_limit - len(backtracking_list)))))
            schedule, moves, taboo_list = backtracking_list.popleft()
            iteration = 1
            save      = True
        else:
            break

        if save:
            backtracking_taboo_list = taboo_list.copy()

        new_move, new_schedule, new_makespan = neighborhood_searching_procedure(
            problem, schedule, moves, best_schedule_makespan, taboo_list)

        if save and len(moves) > 1:
            backtracking_list.append((
                schedule,
                list(filter((lambda move: move != new_move), moves)),
                backtracking_taboo_list
                ))

        schedule = new_schedule
        save     = False

        makespan_history[makespan_history_index] = new_makespan
        makespan_history_index = (makespan_history_index + 1) % makespan_history.size

        if new_makespan < best_schedule_makespan:
            best_schedule          = schedule
            best_schedule_makespan = new_makespan
            iteration              = 0
            save                   = True
            max_iterations         = config.iteration_limit

    return best_schedule, best_schedule_makespan