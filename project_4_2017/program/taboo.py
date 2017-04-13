#!/usr/bin/env python3

from collections import deque
import numpy as np
import pickle
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

        if head.machine_predecessor:# and (not head.job_predecessor or random.random() < 0.5):
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
        return allocations, machine_completion_times.max()
    else:
        return None

def get_makespan(problem, schedule):
    job_completion_times     = np.zeros(problem.job_count)
    machine_completion_times = np.zeros(problem.machine_count)
    job_sequence_indexes     = np.zeros(problem.job_count, int)
    machine_sequence_indexes = np.zeros(problem.machine_count, int)

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

        job_completion_times[operation.job]         = completion_time
        machine_completion_times[operation.machine] = completion_time

        machine_sequence_indexes[operation.machine] += 1
        job_sequence_indexes[operation.job]         += 1

        next_machine_sequence_index = machine_sequence_indexes[operation.machine]

        if next_machine_sequence_index < problem.job_count:
            machine_frontier.append(schedule[operation.machine][next_machine_sequence_index].index)

        next_job_sequence_index = job_sequence_indexes[operation.job]

        if next_job_sequence_index < problem.machine_count:
            job_frontier.append(operation.job * problem.machine_count + next_job_sequence_index)

    if not (machine_frontier or job_frontier):
        return machine_completion_times.max()
    else:
        return None

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

def invert_move(move):
    return tuple(reversed(move))

def neighborhood_searching_procedure(problem, schedule, moves, taboo_list, best_known_makespan):
    best_unforbidden_or_profitable = None

    for move in moves:
        is_move_taboo = move in taboo_list

        move_schedule          = apply_move(problem, schedule, move)
        move_schedule_makespan = get_makespan(problem, move_schedule)

        if not is_move_taboo or move_schedule_makespan < best_known_makespan:
            if is_move_taboo:
                print("IS TABOO AND PROFITABLE {} < {}".format(move_schedule_makespan, best_known_makespan))

            move_info = (move_schedule_makespan, move, move_schedule)
            if not best_unforbidden_or_profitable or move_schedule_makespan < best_unforbidden_or_profitable[0][0]:
                best_unforbidden_or_profitable = [move_info]
            elif move_schedule_makespan == best_unforbidden_or_profitable[0][0]:
                best_unforbidden_or_profitable.append(move_info)

    if best_unforbidden_or_profitable:
        result_makespan, result_move, result_schedule = random.choice(best_unforbidden_or_profitable)
    elif len(moves) == 1:
        result_move     = moves[0]
        result_schedule = apply_move(problem, schedule, result_move)
        result_makespan = get_makespan(problem, result_schedule)
    else:
        for _ in range(len(taboo_list)):
            unforbidden_move = taboo_list.popleft()
            taboo_list.append(taboo_list[-1])

            if unforbidden_move in moves:
                result_move     = unforbidden_move
                result_schedule = apply_move(problem, schedule, result_move)
                result_makespan = get_makespan(problem, result_schedule)
                break
        else:
            raise RuntimeError('balls')

    taboo_list.append(invert_move(result_move))

    return result_move, result_schedule, result_makespan

def taboo_search_algorithm_with_back_jump_tracking(
    problem, best_schedule, best_schedule_makespan, iteration_limit, taboo_limit, backtracking_limit, max_cycle_duration, max_cycle_count):

    def is_cycle(iteration):
        for cycle_duration in range(1, max_cycle_duration + 1):
            for cycle_index in range(1, max_cycle_count + 1):
                first_index  = ((iteration - cycle_index * cycle_duration) + makespan_history.size) % makespan_history.size
                second_index = ((iteration - (cycle_index - 1) * cycle_duration) + makespan_history.size) % makespan_history.size
                if not makespan_history[first_index] or makespan_history[first_index] != makespan_history[second_index]:
                    break
            else:
                #print('cycle detected cycle_duration={}'.format(cycle_duration))
                if cycle_duration <= 2:
                    print('found cycle! cycle_duration={} cycle_index={}'.format(cycle_duration, cycle_index))
                    print(makespan_history_index)
                    print(makespan_history)
                    sys.exit()
                return True

        return False

    taboo_list        = deque(maxlen=taboo_limit)
    backtracking_list = deque(maxlen=backtracking_limit)

    makespan_history       = np.zeros(max_cycle_count * max_cycle_duration)
    makespan_history_index = 0

    iteration = 0
    schedule  = best_schedule
    save      = True

    while True:
        cycle_detected = is_cycle(iteration)

        if cycle_detected:
            makespan_history[:] = 0

        if iteration <= iteration_limit and not cycle_detected:
            iteration += 1

            allocations, makespan = get_allocations(problem, schedule)
            moves                 = find_neighborhood_moves(problem, allocations)

            if not moves:
                print('NO MOVES')
                pickle.dump({'allocations': allocations, 'makespan': makespan, 'schedule': schedule}, open('no_moves.p', 'wb'))
                jssp.io.render_gantt_chart('no_moves.pdf', allocations)
                break
        elif backtracking_list:
            schedule, moves, taboo_list = backtracking_list.popleft()
            iteration = 1
            save      = True
        else:
            break

        if save:
            backtracking_taboo_list = taboo_list.copy()

        move_prime, schedule_prime, makespan = neighborhood_searching_procedure(
            problem, schedule, moves, taboo_list, best_schedule_makespan)

        if save and len(moves) > 1:
            backtracking_list.append((
                schedule,
                list(filter((lambda m: m != move_prime), moves)),
                backtracking_taboo_list
                ))

        schedule = schedule_prime
        save     = False

        makespan_history[makespan_history_index] = makespan
        makespan_history_index = (makespan_history_index + 1) % makespan_history.size

        if makespan < best_schedule_makespan:
            best_schedule, best_schedule_makespan = schedule, makespan
            save = True
            iteration = 0

        print('{}: {}'.format(iteration, best_schedule_makespan))

    return best_schedule, best_schedule_makespan

problem = jssp.io.parse_problem_file(sys.argv[1])

#x = pickle.load(open('no_moves.p', 'rb'))
# {'allocations': allocations, 'makespan': makespan, 'schedule': schedule}
# print(x['makespan'])
# moves = find_neighborhood_moves(problem, x['allocations'])

# for move in moves:
#     print(move)

schedule    = generate_schedule_insertion_algorithm(problem)
_, makespan = get_allocations(problem, schedule)

iteration_limit    = 2500
taboo_limit        = 10
backtracking_limit = 10
max_cycle_duration = 10
max_cycle_count    = 15

best_schedule, best_makespan = taboo_search_algorithm_with_back_jump_tracking(
    problem, schedule, makespan, iteration_limit, taboo_limit, backtracking_limit, max_cycle_duration, max_cycle_count)

print(best_makespan)

allocations, makespan = get_allocations(problem, best_schedule)

print(makespan)

jssp.io.render_gantt_chart('gantt.pdf', allocations)

