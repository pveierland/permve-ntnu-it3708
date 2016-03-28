import * as math from 'mathjs';

export function sample(values, k)
{
    let samples   = new Array(k);
    let lastIndex = values.length - 1;

    for (let i = 0; i < k; i++, lastIndex--)
    {
        const selected    = math.randomInt(lastIndex + 1);
        const value       = values[selected];
        values[selected]  = values[lastIndex];
        values[lastIndex] = value;
        samples[i]        = value;
    }

    return samples;
};

export function shuffle(values)
{
    for (let lastIndex = values.length - 1; lastIndex > 0; lastIndex--)
    {
        const randomIndex   = math.randomInt(lastIndex + 1);
        const value         = values[lastIndex];
        values[lastIndex]   = values[randomIndex];
        values[randomIndex] = value;
    }

    return values;
};
