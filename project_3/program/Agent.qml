import QtQuick 2.0
import QtMultimedia 5.5

Item {
    id: agent
    width: 16
    height: 16
    state: 'still'

    property int stateIndex: 0

    property int remaining_steps: 0
    property int delta_x: 1
    property int delta_y: 0

    property string heading: 'none'
    property variant movements: null

    function move(m) {
        if (!movements || movements.length == 0)
        {
            movements = m
        }
    }

    states: [
        State {
            name: 'still'
        },
        State {
            name: 'moving'
        },
        State {
            name: 'dead'
        }
    ]

    function moveRight() {
        if (state == 'still') {
            heading    = 'right'
            stateIndex = 0
            state      = 'moving'
        }
    }

    function moveLeft() {
        if (state == 'still') {
            heading    = 'left'
            stateIndex = 0
            state      = 'moving'
        }
    }

    function moveUp() {
        if (state == 'still') {
            heading    = 'up'
            stateIndex = 0
            state      = 'moving'
        }
    }

    function moveDown() {
        if (state == 'still') {
            heading    = 'down'
            stateIndex = 0
            state      = 'moving'
        }
    }

    function getHeadingData(heading)
    {
        if (heading == 'up') {
            return { dx: 0, dy: -1, frameOffset: 1 }
        } else if (heading == 'down') {
            return { dx: 0, dy: 1, frameOffset: 5 }
        } else if (heading == 'left') {
            return { dx: -1, dy: 0, frameOffset: 9 }
        } else if (heading == 'right') {
            return { dx: 1, dy: 0, frameOffset: 13 }
        }
    }

    function killEnemy()
    {
        var index = getGridIndex(Math.floor(agent.x / 16), Math.floor(agent.y / 16))
        var value = gridValues[index]

        if (value && isEnemy(value.type)) {
            value.visible = false
            value.destroy()
            gridValues[index] = null
        }
    }

//    Timer {
//        id: movement_timer
//        interval: 5
//        repeat: true
//        triggeredOnStart: true
//        running: true
//
//        onTriggered:
//        {
//            if (state == 'moving')
//            {
//                var headingData = getHeadingData(heading)
//
//                x += headingData.dx
//                y += headingData.dy
//                stateIndex += 1
//
//                var currentFrame = headingData.frameOffset + (stateIndex % 4)
//
//                move_animation.currentFrame = currentFrame
//                move_animation_clone.currentFrame = currentFrame
//
//                if (stateIndex < 16)
//                {
//                    if (x < 0) move_animation_clone.x = 160
//                    else if (x > 144) move_animation_clone.x = -160
//                    else if (y < 0) move_animation_clone.y = 160
//                    else if (y > 144) move_animation_clone.y = -160
//                }
//                else if (stateIndex == 16)
//                {
//                    move_animation_clone.x = 0
//                    move_animation_clone.y = 0
//                    x = x > 144 ? 0 : x < 0 ? 144 : x
//                    y = y > 144 ? 0 : y < 0 ? 144 : y
//
//                    var index = getGridIndex(Math.floor(agent.x / 16), Math.floor(agent.y / 16))
//                    var value = gridValues[index]
//
//                    if (value && isEnemy(value.type)) {
//                        agent.state = 'dead'
//                        stateIndex = 0
//                        die.start()
//                    }
//                    else
//                    {
//                        agent.state = 'still'
//                    }
//                }
//            }
//        }
//    }

    SequentialAnimation {
        id: die

//        PauseAnimation { duration: 100 }
//        ScriptAction { script: { siren.loops = 0; } }
        PauseAnimation { duration: 1000; }
        ScriptAction { script: killEnemy(); }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 17 }
        PropertyAction { target: move_animation_clone; property: 'visible'; value: false }
        PauseAnimation { duration: 500; }
        ScriptAction { script: dying_sound.play(); }

        PropertyAction { target: move_animation; property: 'currentFrame'; value: 18 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 19 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 20 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 21 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 22 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 23 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 24 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 25 }
        PauseAnimation { duration: 150; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 26 }
        PauseAnimation { duration: 50; }
        PropertyAction { target: move_animation; property: 'currentFrame'; value: 27 }
        PauseAnimation { duration: 350; }

        PropertyAction { target: move_animation; property: 'visible'; value: false }
    }

    //Component.onCompleted: { siren.play() }

    SoundEffect {
        id: siren
        source: "data/siren.wav"
        loops: SoundEffect.Infinite
    }

    SoundEffect {
        id: dying_sound
        source: "data/pacman_death.wav"
    }

//    AnimatedSprite  {
//        id: dying_animation
//        width: 16
//        height: 16
//        interpolate: false
//        smooth: false
//        paused: true
//        source: "data/sprites.png"
//        frameCount: 11
//        frameWidth: 16
//        frameHeight: 16
//        frameX: 16
//        frameY: 0
//        frameDuration: 50
//        visible: false
//        loops: 1
//    }

    AnimatedSprite {
        id: wtf
        width: 16
        height: 16
        interpolate: false
        smooth: false
        source: "data/sprites.png"
        frameSync: true
        frameCount: 4
        frameWidth: 16
        frameHeight: 16
        frameX: 208
        frameY: 0
    }

//    AnimatedSprite {
//        id: move_animation
//        width: 16
//        height: 16
//        interpolate: false
//        smooth: false
//        paused: true
//        source: "data/sprites.png"
//        currentFrame: 1
//        frameCount: 28
//        frameWidth: 16
//        frameHeight: 16
//        frameX: 0
//        frameY: 16
//    }
//
//    AnimatedSprite {
//        id: move_animation_clone
//        width: 16
//        height: 16
//        x: 160
//        interpolate: false
//        smooth: false
//        paused: true
//        currentFrame: 1
//        source: "data/sprites.png"
//        frameCount: 28
//        frameWidth: 16
//        frameHeight: 16
//        frameX: 0
//        frameY: 16
//    }


//    AnimatedSprite {
//        id: start
//        width: 16
//        height: 16
//        interpolate: false
//        visible: false
//        smooth: false
//        source: "data/sprites.png"
//        frameCount: 1
//        frameWidth: 16
//        frameHeight: 16
//        frameX: 0
//        frameY: 16
//    }
//
//    AnimatedSprite {
//        id: dying_animation
//        visible: true
//        width: 16
//        height: 16
//        interpolate: false
//        smooth: false
//        running: false
//        source: "data/sprites.png"
//        frameCount: 12
//        frameWidth: 16
//        frameHeight: 16
//        frameX: 0
//        frameY: 0
//        frameRate: 5
//        loops: 1
//    }
}

