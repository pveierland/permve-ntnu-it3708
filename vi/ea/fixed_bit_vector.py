from BitVector import BitVector

class Creator(object):
    def __init__(size, value_distribution_parameter):
        self.value_distribution_parameter = value_distribution_parameter

    def __call__():
        value = BitVector(size=self.size)

        for bit in value:
            bit = random.random() < self.value_distribution_parameter


def fixed_bit_vector_creator(
