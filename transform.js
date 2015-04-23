var fs = require("fs")
var path = require("path")
var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function transform(protovideo) {
    return Bluebird.map(protovideo.clips, function(clips) {
        return new Bluebird(function(resolve, reject) {
            if(protovideo.color == undefined) {
                protovideo.color = "0x000000"
            } else {
                if(!/^0x[0-9a-f]{6}$/i.test(protovideo.color)) {
                    if(/^#([0-9a-f]{3}){1,2}$/i.test(protovideo.color)) {
                        protovideo.color = hash2hex(protovideo.color)
                    } else {
                        throw new Error("The background color must be hex value.")
                    }
                }
            }
            if(protovideo.width == undefined && protovideo.height == undefined) {
                throw new Error("The video must have a width and height.")
            }
            
            var clip_duration = 0
            for(var index in clips) {
                var clip = clips[index]
                if(clip.asset.duration - clip.trim.left - clip.trim.right > clip_duration) {
                    clip_duration = clip.asset.duration - clip.trim.left - clip.trim.right
                }
                if(clip.asset.file == null) {
                    //todo: better format for empty frames.
                    break
                }
                if(clip.trim == undefined) {
                    clip.trim = new Object()
                } if(clip.trim.left == undefined) {
                    clip.trim.left = 0
                } if(clip.trim.right == undefined) {
                    clip.trim.right = 0
                }
                if(clip.size == undefined) {
                    clip.size = new Object()
                } if(clip.size.width == undefined) {
                    clip.size.width = clip.asset.size.width
                } if(clip.size.height == undefined) {
                    clip.size.height = clip.asset.size.height
                }
                //todo: "autopad" default offset?
                if(clip.offset == undefined) {
                    clip.offset = new Object()
                } if(clip.offset.x == undefined) {
                    clip.offset.x = 0
                } if(clip.offset.y == undefined) {
                    clip.offset.y = 0
                }
            }
            
            var clip_directory = path.join(__dirname, "clips")
            if(!fs.existsSync(clip_directory)) {
                fs.mkdir(clip_directory)
            }
            var clip_file = path.join(clip_directory, ShortID.generate() + ".mp4")
            
            var process = new Fluently()
            process.addOutput(clip_file)
            
            var filters = new Array()
            filters.push({
                "filter": "color",
                "options": {
                    "color": protovideo.color,
                    "size": protovideo.width + "x" + protovideo.height,
                    "duration": clip_duration
                },
                "outputs": "nv:0"
            })
            filters.push({
                "filter": "aevalsrc",
                "options": {
                    "exprs": 0,
                    "duration": 0.25
                },
                "outputs": "[na:0]"
            })
            var video_output = "nv:0"
            var audio_output = "na:0"
            for(var index in clips)
            {
                var clip = clips[index]
                if(clip.asset.file == null) {
                    break
                }
                process.addInput(clip.asset.file)
                video_output = "nv:" + (parseInt(index) + 1)
                audio_output = "na:" + (parseInt(index) + 1)
                filters.push({
                    "filter": "trim",
                    "options": {
                        "start": clip.trim.left,
                        "end": clip.asset.duration - clip.trim.right
                    },
                    "inputs": index + ":v",
                    "outputs": "v:" + index + ":a"
                })
                filters.push({
                    "filter": "setpts",
                    "options": "PTS-STARTPTS",
                    "inputs": "v:" + index + ":a",
                    "outputs": "v:" + index + ":b"
                })
                filters.push({
                    "filter": "scale",
                    "options": {
                        "width": clip.size.width,
                        "height": clip.size.height
                    },
                    "inputs": "v:" + index + ":b",
                    "outputs": "v:" + index + ":c"
                })
                filters.push({
                    "filter": "overlay",
                    "options": {
                        "shortest": 1, //?!
                        "x": clip.offset.x,
                        "y": clip.offset.y
                    },
                    "inputs": [
                        "nv:" + index,
                        "v:" + index + ":c"
                    ],
                    "outputs": video_output
                })
                filters.push({
                    "filter": "atrim",
                    "options": {
                        "start": clip.trim.left,
                        "end": clip.asset.duration - clip.trim.right
                    },
                    "inputs": index + ":a",
                    "outputs": "a:" + index + ":a",
                })
                filters.push({
                    "filter": "asetpts",
                    "options": "PTS-STARTPTS",
                    "inputs": "a:" + index + ":a",
                    "outputs": "a:" + index + ":b"
                })
                filters.push({
                    "filter": "amix",
                    "inputs": [
                        "na:" + index,
                        "a:" + index + ":b"
                    ],
                    "outputs": audio_output
                })
            }
            process.complexFilter(filters, [video_output, audio_output])

            process.on("error", function(error) {
                reject(error)
            })
            //process.on("error", function(error, stdout, stderr) {
            //    console.log(stdout)
            //    console.log(stderr)
            //})
            process.on("end", function() {
                //todo: store the data in a clip variable
                //      before it needs to be resolved.
                resolve({
                    "file": clip_file,
                    "duration": clip_duration
                })
            })
            process.run()
        })
    }).then(function(clips) {
        delete protovideo.color
        protovideo.clips = clips
        return protovideo
    })
}

module.exports = transform

function hash2hex(color) {
    color = color.substring(1)
    if(color.length == 3) {
        color = color[0] + color[0]
              + color[1] + color[1]
              + color[2] + color[2]
    }
    color = "0x" + color
    return color
}
