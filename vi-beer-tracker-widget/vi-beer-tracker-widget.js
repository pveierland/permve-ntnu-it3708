import * as chroma from 'chroma-js';

export const constants = Object.freeze(function()
{
    let constants                 = {};
    constants.gameLoopDelayMs     = 1000 / 30;//100;//200;//1000 / 15;//60;
    constants.gameAnimationTicks  = 5;
    constants.gamePlaybackHistory = 5;
    constants.playbackOffset      = 2;
    constants.boxSize             = 0.8;
    constants.spacing             = (1 - 0.8) / 2;
    return constants;
}());

export function stepWorld(world, agent, spawns = null)
{
    world.action = agent ? agent.act(world) : {};

    let idle  = true;
    let moves = 0;

    // Cannot pull and move at the same time
    if (!world.action.pull)
    {
        const lastTrackerPosition = world.trackerPosition;

        world.trackerPosition += world.action.move || 0;

        if (world.wraps)
        {
            world.trackerPosition = (world.trackerPosition + world.width) % world.width;
            moves = Math.abs(world.action.move || 0);
        }
        else
        {
            world.trackerPosition = Math.min(world.width - 5, Math.max(0, world.trackerPosition));
            moves = Math.abs(world.trackerPosition - lastTrackerPosition);
        }

        world.idle = world.trackerPosition !== lastTrackerPosition;
    }

    let smallCapture = false;
    let smallCrash   = false;
    let smallAvoid   = false;

    let bigCapture   = false;
    let bigCrash     = false;
    let bigAvoid     = false;

    if (world.object)
    {
        world.object.y = (world.action.pull && world.object.y < world.height - 1
            ? world.height - 1 : world.object.y + 1);

        if (world.object.y === world.height - 1)
        {
            const adjusted = (world.object.x - world.trackerPosition + world.width) % world.width;
            const overlap  = (adjusted + world.object.size) - world.width;

            const capture = adjusted + world.object.size <= world.trackerSize;
            const crash   = !capture && (adjusted < world.trackerSize || overlap > 0);
            const avoid   = !capture && !crash;

            if (world.object.size < world.trackerSize)
            {
                smallCapture = capture;
                smallCrash   = crash;
                smallAvoid   = avoid;
            }
            else
            {
                bigCapture = capture;
                bigCrash   = crash;
                bigAvoid   = avoid;
            }

//            if (capture)
//            {
//                world.object = null;
//            }
        }
//        else if (world.object.y >= world.height)
//        {
//            world.object = null;
//        }
    }

    world.idle  = idle;
    world.moves = moves;

    world.smallCapture = smallCapture;
    world.smallCrash   = smallCrash;
    world.smallAvoid   = smallAvoid;

    world.bigCapture   = bigCapture;
    world.bigCrash     = bigCrash;
    world.bigAvoid     = bigAvoid;

    if (!world.object)
    {
        if (spawns && spawns.length > 0)
        {
            world.object = spawns.shift();
            world.object.y = 0;
        }
        else
        {
            const objectSize = math.randomInt(1, world.trackerSize + 2);

            // Not wrapping spawned objects since it looks bad
            world.object =
            {
                size: objectSize,
                x:    math.randomInt(world.width - objectSize + 1),
                y:    0
            };
        }
    }
    else if (world.object.y >= world.height || smallCapture || bigCapture)
    {
        world.object = null;
    }

    return world;
}

export class Widget
{
    constructor(options)
    {
        this.agent   = options.agent;
        this.colors  = options.colors;
        this.playing = options.playing || false;
        this.world   = options.world;

        this.canvas  = options.canvas;
        this.context = options.canvas.getContext('2d');

        this.context.scale(this.canvas.width / this.world.width, this.canvas.height / this.world.height);
        this.context.lineWidth = 0.05;

        this.animationIndex = 0;

        this.generateTransitions();
        this.playback = Array(constants.gamePlaybackHistory).fill(this.world);
        this.shadows  = Array(this.world.width);

        this.play();
    }

    generateTransitions()
    {
        function generateTransition(from, to)
        {
            return chroma.scale([from, to]).mode('lab').colors(constants.gameAnimationTicks, 'css');
        }

        this.transitions =
        {
            big:
            {
                big:     generateTransition(this.colors.big, this.colors.big),
                small:   generateTransition(this.colors.big, this.colors.small),
                tracker: generateTransition(this.colors.big, this.colors.tracker)
            },
            small:
            {
                big:     generateTransition(this.colors.small, this.colors.big),
                small:   generateTransition(this.colors.small, this.colors.small),
                tracker: generateTransition(this.colors.small, this.colors.tracker)
            },
            tracker:
            {
                big:     generateTransition(this.colors.tracker, this.colors.big),
                small:   generateTransition(this.colors.tracker, this.colors.small),
                tracker: generateTransition(this.colors.tracker, this.colors.tracker)
            }
        }
    }

    getTrackerColor(world)
    {
        if (world.smallCapture)
        {
            return 'small';
        }
        else if (world.bigCrash || world.bigCapture)
        {
            return 'big';
        }
    }

    render()
    {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const previous = this.playback[constants.playbackOffset - 1];
        const current  = this.playback[constants.playbackOffset];
        const next     = this.playback[constants.playbackOffset + 1];
        const future   = this.playback[constants.playbackOffset + 2];

        const fallingObject = current.object;

        if (fallingObject)
        {
            const y = (fallingObject.y +
                (next.action.pull ? this.world.height - fallingObject.y - 1 : 1)
                * this.animationIndex / constants.gameAnimationTicks);

            this.context.fillStyle = fallingObject.size < this.world.trackerSize ? this.colors.small : this.colors.big;

            this.roundRect(
                fallingObject.x + constants.spacing, y + constants.spacing,
                fallingObject.size - 2 * constants.spacing, constants.boxSize,
                0.1, true, false);
        }

        const freshObject = next.object && next.object.y === 0 ? next.object : null;

        if (freshObject)
        {
            const y = this.animationIndex / constants.gameAnimationTicks - 1;

            this.context.fillStyle = freshObject.size < this.world.trackerSize ? this.colors.small : this.colors.big;

            this.roundRect(
                freshObject.x + constants.spacing, y + constants.spacing,
                freshObject.size - 2 * constants.spacing, constants.boxSize,
                0.1, true, false);
        }

        this.shadows.fill(false);

        if (current.object)
        {
            for (let x = 0; x < current.object.size; x++)
            {
                const pos = (current.object.x + x) % this.world.width;
                this.shadows[pos] = true;
            }
        }

        if (next.object)
        {
            for (let x = 0; x < next.object.size; x++)
            {
                const pos = (next.object.x + x) % this.world.width;
                this.shadows[pos] = true;
            }
        }

        for (let i = 0; i < this.shadows.length; i++)
        {
            if (this.shadows[i])
            {
                const under = i >= current.trackerPosition && i < current.trackerPosition + this.world.trackerSize;
                this.context.fillStyle = under ? 'rgb(0, 0, 0)' : 'rgb(200, 200, 200)';
                this.context.fillRect(i + constants.spacing, this.world.height - constants.spacing / 2, constants.boxSize, constants.spacing / 4);
            }
        }

        const nextColor = this.getTrackerColor(next);
        const fromColor = nextColor || this.getTrackerColor(current) || 'tracker';
        const toColor   = nextColor || this.getTrackerColor(future) || 'tracker';

        this.context.fillStyle = this.transitions[fromColor][toColor][this.animationIndex];

        const trackerStroke = false;
        const trackerPosition = (current.trackerPosition +
            (next.trackerPosition - current.trackerPosition) * this.animationIndex / constants.gameAnimationTicks);

        let trackerClonePosition = (trackerPosition < 0
            ? trackerPosition + this.world.width : trackerPosition - this.world.width);

        this.roundRect(
            trackerPosition + constants.spacing, this.world.height - 1 + constants.spacing,
            this.world.trackerSize - 2 * constants.spacing, constants.boxSize,
            0.1, true, trackerStroke);

        this.roundRect(
            trackerClonePosition + constants.spacing, this.world.height - 1 + constants.spacing,
            this.world.trackerSize - 2 * constants.spacing, constants.boxSize,
            0.1, true, trackerStroke);
    }

    roundRect(x, y, width, height, radius, fill, stroke)
    {
        const ctx = this.context;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();

        if (stroke)
        {
            ctx.stroke();
        }

        if (fill)
        {
            ctx.fill();
        }
    }

    setAgent(agent)
    {
        this.agent = agent;
        this.play();
    }

    play()
    {
        this.timeStep       = 0;
        this.totalTimeSteps = 600;
        this.playing        = true;

        this.stats =
        {
            bigAvoids:     0,
            bigCaptures:   0,
            bigCrashes:    0,
            idle:          0,
            moves:         0,
            smallAvoids:   0,
            smallCaptures: 0,
            smallCrashes:  0
        };

        window.requestAnimationFrame(this.update.bind(this));
    }

    pause()
    {
        this.playing = false;
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
                this.world = stepWorld(JSON.parse(JSON.stringify(this.world)), this.agent);
                this.playback.push(this.world);

                this.stats.idle          += this.world.idle;
                this.stats.bigAvoids     += this.world.bigAvoid;
                this.stats.bigCrashes    += this.world.bigCrash;
                this.stats.bigCaptures   += this.world.bigCapture;
                this.stats.smallAvoids   += this.world.smallAvoid;
                this.stats.smallCrashes  += this.world.smallCrash;
                this.stats.smallCaptures += this.world.smallCapture;

                this.timeStep += 1;

                const smallTotal = this.stats.smallAvoids + this.stats.smallCrashes + this.stats.smallCaptures;
                const bigTotal   = this.stats.bigAvoids + this.stats.bigCrashes + this.stats.bigCaptures;

                console.log(`Time step: ${this.timeStep} Small captured: ${this.stats.smallCaptures}/${smallTotal} (${smallTotal > 0 ? Math.round(100 * this.stats.smallCaptures / smallTotal) : 0}%) Big avoided: ${this.stats.bigAvoids}/${bigTotal} (${bigTotal > 0 ? Math.round(100 * this.stats.bigAvoids / bigTotal) : 0}%).`);

                if (this.playback.length > constants.gamePlaybackHistory)
                {
                    this.playback.shift();
                }
            }

            this.render();
        }

        if (this.timeStep === this.totalTimeSteps)
        {
            this.playing = false;
        }

        if (this.playing)
        {
            window.requestAnimationFrame(this.update.bind(this));
        }
    }
}
