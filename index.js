var path = require("path")
var shortid = require("shortid")
var Bluebird = require("bluebird")
var FluentFfmpeg = require("fluent-ffmpeg")

function fusion(data)
{
    return new Bluebird(function(resolve, reject)
    {
        var width = data.width
        var height = data.height
        var clips = data.clips
        
        Bluebird.map(clips, function(clip)
        {
            //return trim(clip)
            return clip
        })
        .map(function(clip)
        {
            return transform(width, height, clip)
        })
        .then(function(clips)
        {
            return merge(clips)
        })
        .then(function(clip)
        {
            resolve(clip)
        })
    })
}

function trim(clip)
{
    return new Bluebird(function(resolve, reject)
    {
        if(clip.trim != undefined)
        {
            var process = new FluentFfmpeg()
            
            var new_clip = {
                "clip_id": clip.clip_id
            }
            
            process.addInput(clip.file)
            process.setStartTime(clip.trim.left)
            
            new_clip.length = clip.length - clip.trim.left - clip.trim.right
            process.setDuration(new_clip.length)
            
            new_clip.file = "./clips/" + new_clip.clip_id + ".mp4"
            process.addOutput(new_clip.file)
            
            process.on("error", function(error, stdout, stderr)
            {
                reject(stderr.replace(/[\r\n]/g, "\n"))
            })
            
            process.on("end", function()
            {
                resolve(new_clip)
            })
            
            process.run()
        }
        else
        {
            resolve(clip)
        }
    })
}

function transform(width, height, clips)
{
    return new Bluebird(function(resolve, reject)
    {
        var process = new FluentFfmpeg()
        
        var new_clip = {
            "clip_id": shortid.generate()
        }
        
        var initiate_filters = []
        var overlay_filters = []
        var audio_filters = []
        
        initiate_filters.push("nullsrc=size=" + width + "x" + height + "[new-video-0]")
        //audio_filters.push("[0:a][1:a] amix [new-audio-0]")
        //final_audio = "new-audio-0"
        final_video = ""
        
        new_clip.length = Number.MAX_VALUE
        for(var index in clips)
        {
            var clip = clips[index]
            process.addInput(clip.file)
            initiate_filters.push("[" + index + ":v] setpts=PTS-STARTPTS, scale=" + clip.dimensions.width + "x" + clip.dimensions.height + " [video-" + index + "]")
            overlay_filters.push("[new-video-" + index + "][video-" + index + "] overlay=shortest=1:x=" + clip.position.x + ":y=" + clip.position.y + " [new-video-" + (parseInt(index) + 1) + "]")
            final_video = "new-video-" + (parseInt(index) + 1)
            new_clip.length = Math.min(new_clip.length, clip.length)
        }
        
        new_clip.file = "./clips/" + new_clip.clip_id + ".mp4"
        process.addOutput(new_clip.file)
        
        var filters = initiate_filters.concat(overlay_filters)
        process.complexFilter(filters, [final_video, final_audio])
        
        process.on("end", function()
        {
            resolve(new_clip)
        })
        
        process.on("error", function(error, stdout, stderr)
        {
            reject(error)
        })
        
        process.run()
    })
    
    //todo: re-add audio
    //todo: use better json format
    //todo: switch shortest to longest
    //todo: handle null position/dimensions
}

function merge(clips)
{
    return new Bluebird(function(resolve, reject)
    {
        var process = new FluentFfmpeg()
        
        var new_clip = {
            "clip_id": shortid.generate()
        }
        
        new_clip.length = 0
        for(var index in clips)
        {
            var clip = clips[index]
            process.addInput(clip.file)
            new_clip.length += clip.length
        }
        
        process.on("error", function(error, stdout, stderr)
        {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        process.on("end", function()
        {
            resolve(new_clip)
        })
        
        new_clip.file = "./clips/" + new_clip.clip_id + ".mp4"
        process.mergeToFile(new_clip.file, "./clips")
    })
}

transform(1280, 720,
[
    {
        "clip_id": "789",
        "file": "./assets/1.flv",
        "length": 8.06,
        "position": {
            "x": 0,
            "y": 0
        },
        "dimensions": {
            "width": 640,
            "height": 360
        }
    },
    {
        "clip_id": "0AB",
        "file": "./assets/2.flv",
        "length": 8.56,
        "position": {
            "x": 640,
            "y": 360
        },
        "dimensions": {
            "width": 640,
            "height": 360
        }
    }
])
.then(function(clip)
{
    console.log(clip)
})
.catch(function(error)
{
    console.log(error)
})

/*fusion({
    width: 1280,
    height: 720,
    clips: [
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
        },
        {
            subclips: [
                {
                    "clip_id": "789",
                    "file": "./assets/1.flv",
                    "length": 8.06,
                    "position": {
                        "x": 0,
                        "y": 0
                    },
                    "dimensions": {
                        "width": 640,
                        "height": 360
                    }
                },
                {
                    "clip_id": "0AB",
                    "file": "./assets/2.flv",
                    "length": 8.56,
                    "position": {
                        "x": 640,
                        "y": 360
                    },
                    "dimensions": {
                        "width": 640,
                        "height": 360
                    }
                }
            ]
        }
    ]
})
.then(function(clip)
{
    console.log(clip)
})
.catch(function(error)
{
    console.log(error)
})*/
