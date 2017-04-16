#!/usr/bin/env python3

import argparse
import multiprocessing
import pickle

import jssp.aco
import jssp.ba
import jssp.io
import jssp.pso
import jssp.utility

def build_optimizer(args, problem):
    if args.optimizer == 'aco':
        optimizer = jssp.aco.Optimizer(
            jssp.aco.Config(
                evaporation_rate        = args.aco_evaporation_rate,
                beta                    = args.aco_beta,
                initial_pheromone_value = args.aco_initial_pheromone_value,
                enable_taboo            = args.aco_enable_taboo,
                taboo = jssp.utility.TabooConfig(
                    # Stupid lazy limiting hack
                    total_iteration_limit = int(round(0.25 * args.taboo_total_iteration_limit)),
                    iteration_limit       = int(round(0.25 * args.taboo_iteration_limit)),
                    list_limit            = int(round(0.5 * args.taboo_list_limit)),
                    backtracking_limit    = int(round(0.5 * args.taboo_backtracking_limit)),
                    max_cycle_duration    = args.taboo_max_cycle_duration,
                    max_cycle_count       = args.taboo_max_cycle_count)),
            problem)
    elif args.optimizer == 'ba':
        optimizer = jssp.ba.Optimizer(
            jssp.ba.Config(
                num_scouts       = args.ba_num_scouts,
                num_normal_sites = args.ba_num_normal_sites,
                num_elite_sites  = args.ba_num_elite_sites,
                num_normal_bees  = args.ba_num_normal_bees,
                num_elite_bees   = args.ba_num_elite_bees,
                taboo = jssp.utility.TabooConfig(
                    total_iteration_limit = args.taboo_total_iteration_limit,
                    iteration_limit       = args.taboo_iteration_limit,
                    list_limit            = args.taboo_list_limit,
                    backtracking_limit    = args.taboo_backtracking_limit,
                    max_cycle_duration    = args.taboo_max_cycle_duration,
                    max_cycle_count       = args.taboo_max_cycle_count)),
            problem)
    elif args.optimizer == 'pso':
        optimizer = jssp.pso.Optimizer(
            jssp.pso.Config(
                swarm_size = args.pso_swarm_size,
                c1         = args.pso_c1,
                c2         = args.pso_c2,
                w          = args.pso_w),
            problem)

    return optimizer

def run_optimizer(args, problem, result_queue, iterations, index):
    try:
        optimizer = build_optimizer(args, problem)

        for iteration in range(1, iterations + 1):
            result = optimizer.iterate()
            result_queue.put((iteration, result))
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--aco_beta',                    type=float, default=10.0)
    parser.add_argument('--aco_enable_taboo',            action='store_true')
    parser.add_argument('--aco_evaporation_rate',        type=float, default=0.1)
    parser.add_argument('--aco_initial_pheromone_value', type=float, default=0.5)
    parser.add_argument('--aco_iterations',              type=int,   default=20)
    parser.add_argument('--ba_iterations',               type=int,   default=5)
    parser.add_argument('--ba_num_elite_bees',           type=int,   default=1)
    parser.add_argument('--ba_num_elite_sites',          type=int,   default=3)
    parser.add_argument('--ba_num_normal_bees',          type=int,   default=2)
    parser.add_argument('--ba_num_normal_sites',         type=int,   default=5)
    parser.add_argument('--ba_num_scouts',               type=int,   default=10)
    parser.add_argument('--iterations',                  type=int)
    parser.add_argument('--optimizer',                   choices=['aco', 'ba', 'pso'], required=True)
    parser.add_argument('--pickle',                      action='store_true')
    parser.add_argument('--pickle_output_filename',      type=str,   default='solution.pickle')
    parser.add_argument('--problem',                     type=str,   required=True)
    parser.add_argument('--pso_c1',                      type=float, default=0.5)
    parser.add_argument('--pso_c2',                      type=float, default=0.3)
    parser.add_argument('--pso_iterations',              type=int,   default=150)
    parser.add_argument('--pso_swarm_size',              type=int,   default=100)
    parser.add_argument('--pso_w',                       type=float, default=0.5)
    parser.add_argument('--render',                      action='store_true')
    parser.add_argument('--render_output_filename',      type=str,   default='solution.pdf')
    parser.add_argument('--script',                      action='store_true')
    parser.add_argument('--taboo_backtracking_limit',    type=int,   default=8)
    parser.add_argument('--taboo_iteration_limit',       type=int,   default=150)
    parser.add_argument('--taboo_list_limit',            type=int,   default=5)
    parser.add_argument('--taboo_max_cycle_count',       type=int,   default=2)
    parser.add_argument('--taboo_max_cycle_duration',    type=int,   default=100)
    parser.add_argument('--taboo_total_iteration_limit', type=int,   default=1000)
    args = parser.parse_args()

    problem = jssp.io.parse_problem_file(args.problem)

    if args.iterations:
        iterations = args.iterations
    elif args.optimizer == 'aco':
        iterations = args.aco_iterations
    elif args.optimizer == 'ba':
        iterations = args.ba_iterations
    elif args.optimizer == 'pso':
        iterations = args.pso_iterations

    optimizer_count     = multiprocessing.cpu_count()
    optimizer_results   = multiprocessing.Queue()
    optimizer_processes = [multiprocessing.Process(target=run_optimizer,
        args=(args, problem, optimizer_results, iterations, i)) for i in range(optimizer_count)]

    for process in optimizer_processes:
        process.start()

    best_solution     = None
    iteration_results = {}

    try:
        for i in range(optimizer_count * iterations):
            iteration, solution = optimizer_results.get()

            iteration_bundle = iteration_results.get(iteration, None)

            if iteration_bundle:
                iteration_bundle.append(solution)
            else:
                iteration_bundle             = [solution]
                iteration_results[iteration] = iteration_bundle

            if len(iteration_bundle) == optimizer_count:
                best_iteration_solution = min(iteration_bundle, key=lambda solution: solution.makespan)

                if not best_solution or best_iteration_solution.makespan < best_solution.makespan:
                    best_solution = best_iteration_solution

                if not args.script:
                    print('iteration: {} makespan: {}'.format(iteration, best_solution.makespan))

                del iteration_results[iteration]
    except KeyboardInterrupt:
        pass

    for process in optimizer_processes:
        process.join()

    if args.script:
        print(best_solution.makespan)

    if args.pickle:
        pickle.dump(best_solution, open(args.pickle_output_filename, 'wb'))

    if args.render:
        allocations, makespan = jssp.utility.compute_allocations(problem, best_solution.schedule)
        jssp.io.render_gantt_chart(args.render_output_filename, allocations)