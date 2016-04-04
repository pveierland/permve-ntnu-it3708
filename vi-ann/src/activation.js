export function heaviside(value)
{
    return value >= 0 ? 1 : 0;
}

export function logistic(value)
{
    return 1 / (1 + Math.exp(-value));
}

export function relu(value)
{
    return value > 0 ? value : 0;
}

const tanh = Math.tanh;
export { tanh };
