from collections import namedtuple

Allocation = namedtuple('Allocation', ['job_sequence_index', 'machine_sequence_index', 'start_time', 'job_predecessor', 'machine_predecessor', 'operation'])
Operation  = namedtuple('Operation', ['index', 'job', 'machine', 'job_sequence_index', 'time_steps'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs'])
Solution   = namedtuple('Solution', ['operations', 'makespan'])
Reorder    = namedtuple('Reorder', ['machine', 'machine_sequence_edge', 'machine_sequence_index', 'operation', 'after'])