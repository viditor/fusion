var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

var acquire = require("./acquire.js")
var probe = require("./probe.js")
var flatten = require("./flatten.js")
var transform = require("./transform.js")
var merge = require("./merge.js")
var encode = require("./encode.js")
var clean = require("./clean.js")

function fusion(protovideo) {
    return (function() {
        console.log("Acquiring assets.")
        return acquire(protovideo)
    }())
    .then(function(protovideo) {
        console.log("Probing clips.")
        return probe(protovideo)
    })
    .then(function(protovideo) {
        console.log("Flattening clips.")
        return flatten(protovideo)
    })
    .then(function(protovideo) {
        console.log("Transforming clips.")
        return transform(protovideo)
    })
    .then(function(protovideo) {
        console.log("Merging clips.")
        return merge(protovideo)
    })
    .then(function(protovideo) {
        console.log("Encoding video.")
        return encode(protovideo)
    })
    .then(function(protovideo) {
        console.log("Cleaning files.")
        return clean(protovideo)
    })
}

var protovideo = {
    "width": 1280,
    "height": 720,
    "assets": {
        "missing": {
            "url": "https://www.youtube.com/watch?v=UiyDmqO59QE"
        },
        "late for work": {
            "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
        }
    },
    "clips": [
        {
            "asset": "missing",
            "tick": 0,
            "track": 0,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 640,
                "height": 360
            }
        },
        {
            "asset": "late for work",
            "tick": 4,
            "track": 1,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 640,
                "height": 360
            },
            "offset": {
                "x": 640,
                "y": 360
            }
        },
        //uncomment for [blackness]!
        /*{
            "asset": {
                "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
            },
            "tick": 4+8+4+1,
            "track": 1,
            "trim": {
                "left": 2,
                "right": 0
            },
            "size": {
                "width": 1280,
                "height": 720
            }
        }*/
    ]
}

fusion(protovideo).then(function(video) {
    console.log(JSON.stringify(video, null, 4))
})

module.exports = fusion

//todo: render [blackness] during transform
//todo: accept data uri to file
