import * as chroma from 'chroma-js';

export const constants = Object.freeze(function()
{
    let constants = {};
    constants.gameLoopDelayMs = 1000 / 60;//60;
    return constants;
}());

export class Widget
{
    constructor(options)
    {
        this.events  = options.events || [];
        this.grid    = options.grid;
        this.kinds   = options.kinds || {};
        this.objects = options.objects || [];
        this.tracker = options.tracker;

        this.canvas  = options.canvas;
        this.context = options.canvas.getContext('2d');

        this.context.scale(this.canvas.width / this.grid.width, this.canvas.height / this.grid.height);
        this.context.lineWidth = 0.05;

        this.events = [];
        this.movementIndex = 0;

        window.requestAnimationFrame(this.update.bind(this));
    }

    perform(events)
    {
        this.events.push.apply(this.events, events);
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

        if (fill) {
            ctx.fill();
        }

        if (stroke) {
            ctx.stroke();
        }
    }

    render()
    {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const boxSize = 0.8;
        const spacing = (1 - boxSize) / 2;

        for (const object of this.objects)
        {
            const cloneX = object.x - this.grid.width;
            const y      = object.y + this.movementIndex / 5;
            const kind   = this.kinds[object.kind];

            this.context.strokeStyle = kind.color;
            this.context.fillStyle = kind.color;

            this.roundRect(this.context,
                object.x + spacing, y + spacing,
                kind.size - 2 * spacing, boxSize,
                0.1, true, false);

            this.roundRect(this.context,
                cloneX + spacing, y + spacing,
                kind.size - 2 * spacing, boxSize,
                0.1, true, false);
        }

        if (this.tracker.captured)
        {
            this.context.strokeStyle = this.tracker.colors[4];
            this.context.fillStyle   = this.tracker.colors[4];
        }
        else if (this.tracker.capture)
        {
            this.context.strokeStyle = this.tracker.colors[this.movementIndex];
            this.context.fillStyle   = this.tracker.colors[this.movementIndex];
        }
        else if (this.tracker.fading)
        {
            this.context.strokeStyle = this.tracker.colors[5 - this.movementIndex];
            this.context.fillStyle   = this.tracker.colors[5 - this.movementIndex];
        }
        else
        {
            this.context.strokeStyle = this.tracker.color;
            this.context.fillStyle = this.tracker.color;
        }

        const currentEvent = this.currentEvent;

        let trackerPosition = this.tracker.position;

        if (currentEvent && currentEvent.move)
        {
            trackerPosition += this.currentEvent.move * this.movementIndex / 5;
        }

        let trackerClonePosition = (trackerPosition < 0
            ? trackerPosition + this.grid.width : trackerPosition - this.grid.width);

        this.roundRect(this.context,
            trackerPosition + spacing, this.grid.height - 1 + spacing,
            this.tracker.size - 2 * spacing, boxSize,
            0.1, true, false);

        this.roundRect(this.context,
            trackerClonePosition + spacing, this.grid.height - 1 + spacing,
            this.tracker.size - 2 * spacing,
            boxSize, 0.1, true, false);
    }

    calculateUpdatedPosition(position, move)
    {
        let updatedPosition = position + (move || 0);

        if (updatedPosition < 0)
        {
            return updatedPosition + this.grid.width;
        }
        else if (updatedPosition >= this.grid.width)
        {
            return updatedPosition - this.grid.width;
        }
        else
        {
            return updatedPosition;
        }

        return updatedPosition;
    }

    update(currentTime)
    {
        let ticks = (currentTime && this.lastUpdateTime
                  ? (currentTime - this.lastUpdateTime) / constants.gameLoopDelayMs : 0);

        this.lastUpdateTime = currentTime;

        let currentEvent = this.currentEvent;
        let nextEvent    = this.nextEvent;

        for (; ticks > 0; ticks -= 1)
        {
            if (!currentEvent)
            {
                currentEvent = this.currentEvent = this.events.shift();
                nextEvent    = this.nextEvent    = this.events.length > 0 ? this.events[0] : null;

                //this.tracker.capture   = false;
                //this.tracker.collision = false;

                if (currentEvent)
                {
                    this.tracker.nextPosition = this.calculateUpdatedPosition(this.tracker.position, currentEvent.move);

                    if (this.tracker.fading)
                    {
                        this.tracker.fading = false;
                    }

                    if (this.tracker.captured)
                    {
                        this.tracker.captured = false;
                        this.tracker.fading   = true;
                    }

                    if (this.tracker.capture)
                    {
                        this.tracker.capture  = false;
                        this.tracker.captured = true;
                    }

                    if (currentEvent.spawn)
                    {
                        let object = currentEvent.spawn;
                        object.y   = -1;
                        this.objects.push(object);
                    }

                    if (nextEvent)
                    {
                        const endPosition = this.calculateUpdatedPosition(this.tracker.nextPosition, nextEvent.move);

                        if (this.objects.length > 0)
                        {
                            const object = this.objects[0];
                            if (object.y === this.grid.height - 3)
                            {
                                const kind = this.kinds[object.kind];
                                const ox = (object.x + (this.grid.width - this.tracker.nextPosition)) % this.grid.width;

                                const capture = ox + kind.size <= this.tracker.size;

                                if (capture)
                                {
                                    this.tracker.capture = capture;
                                    this.tracker.colors  = chroma.scale([this.tracker.color, kind.color]).mode('lch').colors(5, 'css');
                                }
                            }
                        }
                    }
                }
            }

            if (currentEvent)
            {
                const movementIndex = ++this.movementIndex;

                if (movementIndex === 5)
                {
                    this.tracker.position = this.tracker.nextPosition;

                    if (this.tracker.captured)
                    {
                        this.objects.shift();
                    }

                    this.objects = this.objects.filter(object =>
                    {
                        object.y += 1;
                        return object.y < this.grid.height;
                    });

                    this.currentEvent  = null;
                    this.movementIndex = 0;
                }
            }
        }

        this.render();

        window.requestAnimationFrame(this.update.bind(this));
    }
}

