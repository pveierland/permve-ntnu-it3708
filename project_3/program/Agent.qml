import QtQuick 2.0

Item {
    id: agent
    width: 16
    height: 16

    property int remaining_steps: 0
    property int delta_x: 1
    property int delta_y: 0

    function moveRight() {
        delta_x = 1
        delta_y = 0
        remaining_steps = 16
    }

    function moveLeft() {
        delta_x = -1
        delta_y = 0
        remaining_steps = 16
    }

    function moveUp() {
        delta_x = 0
        delta_y = -1
        remaining_steps = 16
    }

    function moveDown() {
        delta_x = 0
        delta_y = 1
        remaining_steps = 16
    }

//    states: [
//        State {
//            name: "dead"
//            PropertyChanges { target: dying_animation; running: true; }
//            PropertyChanges { target: start; visible: false; }
//            PropertyChanges { target: dying_animation; visible: true; currentFrame: 1; running: true; }
//        }
//    ]

    Timer {
        id: movement_timer
        interval: 50
        repeat: true
        triggeredOnStart: true
        running: true
        onTriggered: {
            if (agent.remaining_steps > 0) {
                agent.x += agent.delta_x
                agent.y += agent.delta_y
                agent.remaining_steps -= 1
                move_right_animation.currentFrame = agent.remaining_steps > 0 ? 16 - agent.remaining_steps : 0
            }
            else
            {
                move_right_animation.currentFrame = 0
            }
        }
    }

    //SoundEffect {
    //    id: dying_sound
    //    source: "data/pacman_death.wav"
    //}

    AnimatedSprite {
        id: move_right_animation
        width: 16
        height: 16
        interpolate: false
        smooth: false
        paused: true
        source: "data/sprites.png"
        frameCount: 16
        frameWidth: 16
        frameHeight: 16
        frameX: 0
        frameY: 16
    }


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

