import * as chroma from 'chroma-js';

export const constants = Object.freeze(function()
{
    let constants = {};
    constants.gameLoopDelayMs     = 1000 / 30;//100;//200;//1000 / 15;//60;
    constants.gameAnimationTicks  = 5;
    constants.gamePlaybackHistory = 5;
    constants.playbackOffset      = 2;
    return constants;
}());

function stepWorld(world, agent)
{
    world = JSON.parse(JSON.stringify(world));

    world.objects = world.objects.filter(object =>
    {
        return !object.capture && object.y < world.height;
    });

    world.action = agent ? agent.act(world) : {};

    world.trackerPosition += world.action.move || 0;

    if (world.wraps)
    {
        world.trackerPosition = (world.trackerPosition + world.width) % world.width;
    }
    else
    {
        world.trackerPosition = Math.min(world.width - 1, Math.max(0, world.trackerPosition));
    }

    for (const object of world.objects)
    {
        object.y = world.action.pull ? world.height - 1 : object.y + 1;

        if (object.y === world.height - 1)
        {
            const adjusted = (object.x - world.trackerPosition + world.width) % world.width;
            const overlap  = (adjusted + object.size) - world.width;

            if (object.size < world.trackerSize)
            {
                const capture = adjusted + object.size <= world.trackerSize;
                object.capture = capture;
            }
            else
            {
                const collision = adjusted < world.trackerSize || overlap > 0;
                object.collision = collision;
            }
        }
    }

    if (!world.objects.some(object => !object.capture && !object.collision && object.y < world.height))
    {
        const objectSize = math.randomInt(1, world.trackerSize + 2);

        // Not wrapping spawned objects since it looks bad.
        world.objects.push(
        {
            size: objectSize,
            x:    math.randomInt(world.width - objectSize + 1),
            y:    0
        });
    }

    return world;
}

export class Widget
{
    constructor(options)
    {
        this.colors = options.colors;
        this.grid    = options.grid;
        this.objects = options.objects || [];
        this.tracker = options.tracker;
        this.agent   = options.agent;

        this.world = { width: 30, height: 15, trackerPosition: 0, trackerSize: 5, wraps: true, objects: [] };

        this.canvas  = options.canvas;
        this.context = options.canvas.getContext('2d');

        this.context.scale(this.canvas.width / this.grid.width, this.canvas.height / this.grid.height);
        this.context.lineWidth = 0.05;

        let colorScales = {};

        for (let kind of Object.keys(this.colors))
        {
            if (kind !== 'tracker')
            {
                colorScales[kind] = chroma.scale([this.colors.tracker, this.colors[kind]]).mode('lch').colors(5, 'css');
            }
        }

        this.colorScales = colorScales;

        this.animationIndex = 0;

        this.playback = Array(constants.gamePlaybackHistory).fill(this.world);

        window.requestAnimationFrame(this.update.bind(this));
    }

    roundRect(ctx, x, y, width, height, radius, fill, stroke)
    {
        if (typeof stroke == 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = {tl: radius, tr: radius, br: radius, bl: radius};
        } else {
            var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }

        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();

        if (stroke) {
            ctx.stroke();
        }

        if (fill) {
            ctx.fill();
        }
    }

    render()
    {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const boxSize = 0.8;
        const spacing = (1 - boxSize) / 2;

        for (const object of this.playback[constants.playbackOffset].objects)
        {
            if (!object.capture)
            {
                const pull   = this.playback[constants.playbackOffset + 1].action.pull;
                const cloneX = object.x - this.playback[constants.playbackOffset].width;
                const y      = object.y + (pull ? this.world.height - object.y - 1 : 1) * this.animationIndex / 5;

                this.context.strokeStyle = this.colors[object.size];
                this.context.fillStyle   = this.colors[object.size];

                this.roundRect(this.context,
                    object.x + spacing, y + spacing,
                    object.size - 2 * spacing, boxSize,
                    0.1, true, false);

                this.roundRect(this.context,
                    cloneX + spacing, y + spacing,
                    object.size - 2 * spacing, boxSize,
                    0.1, true, false);
            }
        }

        for (const object of this.playback[constants.playbackOffset + 1].objects)
        {
            if (object.y === 0)
            {
                const cloneX = object.x - this.playback[constants.playbackOffset].width;
                const y      = this.animationIndex / 5 - 1;

                this.context.strokeStyle = this.colors[object.size];
                this.context.fillStyle   = this.colors[object.size];

                this.roundRect(this.context,
                    object.x + spacing, y + spacing,
                    object.size - 2 * spacing, boxSize,
                    0.1, true, false);

                this.roundRect(this.context,
                    cloneX + spacing, y + spacing,
                    object.size - 2 * spacing, boxSize,
                    0.1, true, false);
            }
        }

        let shadows = Array(this.world.width).fill(false);

        for (const object of this.playback[constants.playbackOffset].objects)
        {
            if (object.y < this.world.height - 1)
            {
                for (let x = 0; x < object.size; x++)
                {
                    const pos = (object.x + x) % this.world.width;
                    shadows[pos] = true;
                }
            }
        }

        for (const object of this.playback[constants.playbackOffset + 1].objects)
        {
            if (object.y < this.world.height - 1)
            {
                for (let x = 0; x < object.size; x++)
                {
                    const pos = (object.x + x) % this.world.width;
                    shadows[pos] = true;
                }
            }
        }

        const currentTrackerPosition = this.playback[constants.playbackOffset].trackerPosition;

        for (let i = 0; i < shadows.length; i++)
        {
            if (shadows[i])
            {
                const under = i >= currentTrackerPosition && i < currentTrackerPosition + 5;
                this.context.fillStyle = under ? 'rgb(0, 0, 0)' : 'rgb(200, 200, 200)';
                this.context.fillRect(i + spacing, this.world.height - spacing / 2, boxSize, spacing / 4);
            }
        }

        let trackerColor = null;

        if (!trackerColor)
        {
            for (const object of this.playback[constants.playbackOffset + 1].objects)
            {
                if (object.capture || object.collision)
                {
                    trackerColor = this.colors[object.size];
                    break;
                }
            }
        }

        if (!trackerColor)
        {
            for (const object of this.playback[constants.playbackOffset + 2].objects)
            {
                if (object.capture || object.collision)
                {
                    trackerColor = this.colorScales[object.size][this.animationIndex];
                    break;
                }
            }
        }

        if (!trackerColor)
        {
            for (const object of this.playback[constants.playbackOffset + 0].objects)
            {
                if (object.capture || object.collision)
                {
                    trackerColor = this.colorScales[object.size][4 - this.animationIndex];
                    break;
                }
            }
        }

        const trackerStroke = trackerColor ? false : true;

        this.context.strokeStyle = trackerColor ? trackerColor : 'rgb(255, 255, 255)';
        this.context.fillStyle   = trackerColor || this.colors.tracker;

        let trackerPosition = this.playback[constants.playbackOffset].trackerPosition;

        if (this.playback[constants.playbackOffset + 1].action)
        {
            trackerPosition += (this.playback[constants.playbackOffset + 1].action.move || 0) * this.animationIndex / 5;
        }

        let trackerClonePosition = (trackerPosition < 0
            ? trackerPosition + this.playback[constants.playbackOffset].width : trackerPosition - this.playback[constants.playbackOffset].width);

        this.roundRect(this.context,
            trackerPosition + spacing, this.playback[constants.playbackOffset].height - 1 + spacing,
            this.tracker.size - 2 * spacing, boxSize,
            0.1, true, trackerStroke);

        this.roundRect(this.context,
            trackerClonePosition + spacing, this.playback[constants.playbackOffset].height - 1 + spacing,
            this.tracker.size - 2 * spacing, boxSize,
            0.1, true, trackerStroke);
    }

    setAgent(agent)
    {
        this.agent = agent;
    }

    update(currentTime)
    {
        let ticks = (currentTime && this.lastUpdateTime
                  ? Math.floor((currentTime - this.lastUpdateTime) / constants.gameLoopDelayMs) : 0);

        this.lastUpdateTime = this.lastUpdateTime ? this.lastUpdateTime + constants.gameLoopDelayMs * ticks : currentTime;

        for (; ticks > 0; ticks -= 1)
        {
            const animationIndex = this.animationIndex =
                (this.animationIndex + 1) % constants.gameAnimationTicks;

            if (animationIndex === 0)
            {
                this.world = stepWorld(this.world, this.agent);

                this.playback.push(this.world);

                if (this.playback.length > constants.gamePlaybackHistory)
                {
                    this.playback.shift();
                }
            }

            this.render();
        }

        window.requestAnimationFrame(this.update.bind(this));
    }
}

