export const Action = Object.freeze(
{
    stay:      1,
    moveUp:    2,
    moveDown:  3,
    moveLeft:  4,
    moveRight: 5,
});

export const GameEntity = Object.freeze(
{
    void:        0,
    dot:         1,
    cherry:      2,
    strawberry:  3,
    orange:      4,
    apple:       5,
    melon:       6,
    blinky:      7,
    pinky:       8,
    inky:        9,
    clyde:      10
});

export const Constants = Object.freeze(function()
{
    let constants = {};

    constants.animationDivider = 8;
    constants.gameLoopDelayMs  = 1000 / 30;

    constants.food =
    [
        GameEntity.cherry,
        GameEntity.strawberry,
        GameEntity.orange,
        GameEntity.apple,
        GameEntity.melon
    ];

    constants.enemies =
    [
        GameEntity.blinky,
        GameEntity.pinky,
        GameEntity.inky,
        GameEntity.clyde
    ];

    constants.spriteInfo                        = {};
    constants.spriteInfo[GameEntity.dot]        = { x: 176, y:  0, frames: 1 };
    constants.spriteInfo[GameEntity.cherry]     = { x: 192, y:  0, frames: 1 };
    constants.spriteInfo[GameEntity.strawberry] = { x: 192, y: 16, frames: 1 };
    constants.spriteInfo[GameEntity.orange]     = { x: 192, y: 32, frames: 1 };
    constants.spriteInfo[GameEntity.apple]      = { x: 192, y: 48, frames: 1 };
    constants.spriteInfo[GameEntity.melon]      = { x: 192, y: 64, frames: 1 };
    constants.spriteInfo[GameEntity.blinky]     = { x: 160, y: 16, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.pinky]      = { x: 160, y: 32, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.inky]       = { x: 160, y: 48, frames: 2, divider: 8 };
    constants.spriteInfo[GameEntity.clyde]      = { x:  64, y: 64, frames: 8, divider: 8 };

    constants.agentSpriteInfo                   = {};
    constants.agentSpriteInfo[Action.stay]      = { x: 0, y: 16, frames: 1 };
    constants.agentSpriteInfo[Action.moveUp]    = { x: 0, y: 16, frames: 4 };
    constants.agentSpriteInfo[Action.moveDown]  = { x: 0, y: 32, frames: 4 };
    constants.agentSpriteInfo[Action.moveLeft]  = { x: 0, y: 48, frames: 4 };
    constants.agentSpriteInfo[Action.moveRight] = { x: 0, y: 64, frames: 4 };

    return constants;
}());

export const Utility = Object.freeze(function()
{
    let utility = {};

    utility.getRandomIntInclusive = function(min, max)
    {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    utility.isEnemy = function(entity)
    {
        return entity >= GameEntity.blinky && entity <= GameEntity.clyde;
    };

    utility.isFood = function(entity)
    {
        return entity >= GameEntity.cherry && entity <= GameEntity.melon;
    };

    return utility;
}());

export class FlatlandWorld
{
    constructor(options)
    {
        this.stepCallback = options.stepCallback || null;
        this.model        = options.model || null;

        this.resetGameState();

        this.canvas  = document.getElementById(options.elementId);
        this.context = this.canvas.getContext('2d');
        this.context.imageSmoothingEnabled = false;
        this.context.fillStyle             = 'black';

        this.sprites        = new Image();
        this.sprites.onload = window.requestAnimationFrame.bind(window, this.update.bind(this));
        this.sprites.src    = 'vi-flatland-world-sprites.png';
    }

    computeAgentSpritePositions()
    {
        let x = this.model.agent.x * 8;
        let y = this.model.agent.y * 8;
        let cloneX = x, cloneY = y;

        const currentAction = this.currentAction;

        if (currentAction && currentAction !== Action.stayPut)
        {
            const movementOffset = 2 * this.movementIndex;

            switch (currentAction)
            {
                case Action.moveUp:
                {
                    y -= movementOffset;
                    cloneY = y < 0 ? y + 8 * (this.model.height + 1) : y;
                    break;
                }
                case Action.moveDown:
                {
                    y += movementOffset;
                    cloneY = (y >= 8 * (this.model.height - 1)
                        ? y - 8 * (this.model.height + 1) : y);
                    break;
                }
                case Action.moveLeft:
                {
                    x -= movementOffset;
                    cloneX = x < 0 ? x + 8 * (this.model.width + 1) : x;
                    break;
                }
                case Action.moveRight:
                {
                    x += movementOffset;
                    cloneX = (x >= 8 * (this.model.width - 1)
                        ? x - 8 * (this.model.width + 1) : x);
                    break;
                }
            }
        }

        return [ { x: x, y: y }, { x: cloneX, y: cloneY } ];
    }

    computeTargetCell(position, action, steps)
    {
        switch (action)
        {
            case Action.stayPut:
            {
                return position;
            }
            case Action.moveUp:
            {
                const y = position.y - steps;
                return { x: position.x,
                         y: y < 0 ? y + this.model.height + 1 : y };
            }
            case Action.moveDown:
            {
                const y = position.y + steps;
                return { x: position.x,
                         y: y >= this.model.height ? y - this.model.height - 1 : y };
            }
            case Action.moveLeft:
            {
                const x = position.x - steps;
                return { x: x < 0 ? x + this.model.width + 1 : x,
                         y: position.y };
            }
            case Action.moveRight:
            {
                const x = position.x + steps;
                return { x: x >= this.model.width ? x - this.model.width - 1: x,
                         y: position.y };
            }
        }
    }

    getCellIndex(position)
    {
        return position.y * this.model.width + position.x;
    }

    perform(actions)
    {
        this.actionQueue.push.apply(this.actionQueue, actions);
    }

    render()
    {
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.model.height; y += 1)
        {
            for (let x = 0; x < this.model.height; x += 1)
            {
                const index  = y * this.model.width + x;
                const entity = this.model.cells[index];

                if (entity !== GameEntity.void)
                {
                    const animationOffset = this.animationOffsets[index];
                    this.renderSprite(Constants.spriteInfo[entity], x, y, animationOffset);
                }
            }
        }

        let agentSpritePosition, agentCloneSpritePosition;
        [agentSpritePosition, agentCloneSpritePosition] = this.computeAgentSpritePositions();
        this.renderAgent(agentSpritePosition, agentCloneSpritePosition);

        this.animationIndex += 1;
    }

    renderAgent(position, clonePosition)
    {
        const sprite          = Constants.agentSpriteInfo[this.currentAction || Action.stay];
        const frameOffset     = this.movementIndex % sprite.frames;
        const spriteAdjustedX = sprite.x + 16 * frameOffset;

        this.context.drawImage(this.sprites,
                               spriteAdjustedX, sprite.y, 16, 16,
                               position.x, position.y, 16, 16);

        this.context.drawImage(this.sprites,
                               spriteAdjustedX, sprite.y, 16, 16,
                               clonePosition.x, clonePosition.y, 16, 16);
    }

    renderSprite(sprite, x, y, animationOffset)
    {
        let frameOffset = 0;

        if (sprite.frames > 0)
        {
            const dividedAnimationIndex = sprite.divider ? Math.floor(this.animationIndex / sprite.divider) : this.animationIndex;
            frameOffset = (dividedAnimationIndex + (animationOffset || 0)) % sprite.frames;
        }

        this.context.drawImage(this.sprites,
                               sprite.x + 16 * frameOffset, sprite.y, 16, 16,
                               x * 8, y * 8, 16, 16);
    }

    resetGameState()
    {
        this.actionQueue    = [];
        this.animationIndex = 0;
        this.currentAction  = null;
        this.movementIndex  = 0;
        this.stats          = { foodEaten: 0, poisonEaten: 0, timeSteps: 0 };

        if (this.model)
        {
            this.animationOffsets = this.model.cells.map(
                v => v in Constants.spriteInfo
                     ? Utility.getRandomIntInclusive(0, Constants.spriteInfo[v].frames - 1)
                     : 0);
        }
    }

    setGridValue(position, value)
    {
        const index    = this.getCellIndex(position);
        const previous = this.model.cells[index];
        this.model.cells[index] = value;
        return previous;
    }

    setModel(model)
    {
        this.model = model;
        this.resetGameState();
    }

    update(currentTime)
    {
        if (this.model)
        {
            let ticks = (currentTime && this.lastUpdateTime
                      ? (currentTime - this.lastUpdateTime) / Constants.gameLoopDelayMs : 0);

            this.lastUpdateTime = currentTime;

            for (; ticks > 0; ticks -= 1)
            {
                let currentAction = this.currentAction;

                if (!currentAction)
                {
                    currentAction = this.currentAction = this.actionQueue.shift();
                }

                if (currentAction)
                {
                    const movementIndex = ++this.movementIndex;

                    if (currentAction !== Action.stayPut)
                    {
                        if (movementIndex === 5)
                        {
                            const dotCell = this.computeTargetCell(
                                this.model.agent, currentAction, 1);
                            this.setGridValue(dotCell, GameEntity.void);
                        }
                        else if (movementIndex === 8)
                        {
                            const updatedAgentPosition = this.computeTargetCell(
                                this.model.agent, currentAction, 2);

                            this.model.agent = updatedAgentPosition;

                            let eatenCellValue = this.setGridValue(updatedAgentPosition, GameEntity.void);

                            if (Utility.isFood(eatenCellValue))
                            {
                                this.stats.foodEaten += 1;
                            }
                            else if (Utility.isEnemy(eatenCellValue))
                            {
                                this.stats.poisonEaten += 1;
                            }
                        }
                    }

                    if (movementIndex === 8)
                    {
                        this.currentAction   = null;
                        this.movementIndex   = 0;
                        this.stats.timeSteps += 1;

                        if (this.stepCallback)
                        {
                            this.stepCallback(this.stats);
                        }
                    }
                }
            }

            this.render();
        }

        window.requestAnimationFrame(this.update.bind(this));
    }
}
