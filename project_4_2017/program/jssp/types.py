from collections import namedtuple

Allocation = namedtuple('Allocation', ['job_sequence_index', 'machine_sequence_index', 'start_time', 'job_predecessor', 'machine_predecessor', 'operation'])
Problem    = namedtuple('Problem', ['job_count', 'machine_count', 'jobs', 'operations'])
Reorder    = namedtuple('Reorder', ['machine', 'machine_sequence_edge', 'machine_sequence_index', 'operation', 'after'])
Solution   = namedtuple('Solution', ['schedule', 'makespan'])

class Operation(namedtuple('Operation', ['index', 'job', 'machine', 'job_sequence_index', 'time_steps'])):
    def __eq__(self, other):
        return self.index == other.index

    def __hash__(self):
        return hash(self.index)

    def __ne__(self, other):
        return self.index != other.index