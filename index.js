var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

var merge = require("./scripts/merge.js")
var transform = require("./scripts/transform.js")
var youtube = require("./scripts/youtube.js")
var flatten = require("./scripts/flatten.js")

function acquire(clips) {
    return Bluebird.map(clips, function(clip, index) {
        //if(clip.asset is a number) {}
        //if(clip.asset.data != undefined) {} else
        if(clip.asset.url != undefined) {
            if(clip.asset.url.indexOf("youtube.com") != -1) {
                return youtube(clip.asset.url).then(function(asset_file) {
                    clip.asset.file = asset_file
                    return clip
                })
            } else {
                //http
            }
        } else {
            throw new Error("Clip #" + index + " has no asset.")
        }
    })
}

function probe(clips) {
    return Bluebird.map(clips, function(clip) {
        return new Bluebird(function(resolve, reject) {
            Fluently.ffprobe(clip.asset.file, function(error, probe) {
                if(error) {
                    reject(error)
                } else {
                    clip.duration = Math.floor(probe.format.duration)
                    resolve(clip)
                }
            })
        })
    })
}

function fusion(protovideo) {
    return acquire(protovideo.clips).then(probe).then(flatten).then(function(clips) {
        return Bluebird.map(clips, function(clip) {
            return transform(protovideo.screen, clip)
        })
    }).then(function(clips) {
        return merge(clips)
    })
}

var protovideo = {
    "screen": {
        "width": 1280,
        "height": 720
    },
    "clips": [
        {
            "asset": {
                "url": "https://www.youtube.com/watch?v=UiyDmqO59QE"
            },
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
            "asset": {
                "url": "https://www.youtube.com/watch?v=kfchvCyHmsc"
            },
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
            "position": {
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
})/*.catch(function(error) {
    console.log(error)
})*/

function flatten(protovideo) {
    return new Bluebird(function(resolve, reject) {
        resolve(protovideo)
    })
}

//todo: handle null values in clips (trim, size, POSITION, etc)
//todo: render [blackness] during transform?
//todo: convert from and to data uri
//todo: probe data in clips
//todo: unlink any and all temp clips
//todo: check for clip dir before writing
//todo: rename "screen" and "position"

//todo: move duration into asset json
//todo: allow http urls, not just youtube urls
//todo: allow asset_id to reference protovideo dictionary
//todo: clean up flatten a bit? SORT before starting.

module.exports = fusion
