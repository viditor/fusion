var path = require("path")
var Bluebird = require("bluebird")
var FluentFfmpeg = require("fluent-ffmpeg")

function fusion(clips)
{
    Bluebird.map(clips, function(clip)
    {
        return trim(clip)
    })
    .then(function(clips)
    {
        console.log(clips)
    })
    .catch(function(error)
    {
        console.log(error)
    })
}

function trim(clip)
{
    return new Bluebird(function(resolve, reject)
    {
        var trimming = new FluentFfmpeg()
        
        trimming.addInput(clip.file)
        trimming.setStartTime(clip.trim.left)
        trimming.setDuration(clip.length - clip.trim.left - clip.trim.right)
        trimming.addOutput("./clips/" + clip.clip_id + ".mp4")
    
        trimming.on("end", function() {
            clip.file = "./clips/" + clip.clip_id + ".mp4"
            clip.length = clip.length - clip.trim.left - clip.trim.right
            delete clip.trim
            resolve(clip)
        })
        trimming.on("error", function(error, stdout, stderr) {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        trimming.run()
    })
}

fusion([
    {
        "clip_id": "123",
        "file": "./assets/1.flv",
        "trim": {
            "left": 2,
            "right": 0
        },
        "length": 8.06
    },
    {
        "clip_id": "456",
        "file": "./assets/2.flv",
        "trim": {
            "left": 0,
            "right": 1.5
        },
        "length": 8.56
    }
])
