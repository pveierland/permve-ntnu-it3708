let random = {};

random.uniform = function(low, high)
{
    return low + (high - low) * Math.random();
};

export { random };

