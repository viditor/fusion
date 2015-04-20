var path = require("path")
var fs = require("fs")
var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function transform(protovideo) {
    return Bluebird.map(protovideo.clips, function(clips) {
        return new Bluebird(function(resolve, reject) {
            var screen = JSON.parse(JSON.stringify(protovideo.screen))
            if(screen.color != undefined) {
                if(!/^#([0-9a-f]{3}){1,2}$/i.test(screen.color)) {
                    throw new Error("The color must be hex value.")
                }
                screen.color = screen.color.substring(1)
                if(screen.color.length === 3) {
                    screen.color = screen.color[0] + screen.color[0]
                                 + screen.color[1] + screen.color[1]
                                 + screen.color[2] + screen.color[2]
                }
                screen.color = "0x" + screen.color
            } else {
                screen.color = "0x000000"
            }
            if(screen.width == undefined && screen.height == undefined) {
                throw new Error("The video must have a width and height.")
            }
            clips = JSON.parse(JSON.stringify(clips))
            for(var index in clips) {
                var clip = clips[index]
                if(clip.trim === undefined) {
                    clip.trim = new Object()
                }
                if(clip.trim.left === undefined) {
                    clip.trim.left = 0
                }
                if(clip.trim.right === undefined) {
                    clip.trim.right = 0
                }
                if(clip.position === undefined) {
                    clip.position = new Object()
                }
                if(clip.position.x === undefined) {
                    clip.position.x = 0
                }
                if(clip.position.y === undefined) {
                    clip.position.y = 0
                }
                if(clip.size === undefined) {
                    clip.size = new Object()
                }
                if(clip.size.width === undefined) {
                    clip.size.width = screen.width
                }
                if(clip.size.height === undefined) {
                    clip.size.height = screen.height
                }
            }

            var directory = path.join(__dirname, "/../clips")
            if(!fs.existsSync(directory)) {
                fs.mkdir(directory)
            }

            var new_clip = new Object()
            new_clip.clip_id = ShortID.generate()
            new_clip.file = "./clips/" + new_clip.clip_id + ".mp4"

            var process = new Fluently()
            process.addOutput(new_clip.file)

            var filters = new Array()
            filters.push({
                "filter": "color",
                "options": {
                    "color": screen.color,
                    "size": screen.width + "x" + screen.height
                },
                "outputs": "nv:0"
            })
            filters.push({
                "filter": "aevalsrc",
                "options": {
                    "exprs": 0,
                    "duration": 1
                },
                "outputs": "[na:0]"
            })
            var video_output = "nv:0"
            var audio_output = "na:0"
            for(var index in clips)
            {
                var clip = clips[index]
                process.addInput(clip.asset.file)
                video_output = "nv:" + (parseInt(index) + 1)
                audio_output = "na:" + (parseInt(index) + 1)
                filters.push({
                    "filter": "trim",
                    "options": {
                        "start": clip.trim.left,
                        "end": clip.duration - clip.trim.right
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
                        "x": clip.position.x,
                        "y": clip.position.y
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
                        "end": clip.duration - clip.trim.right
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
            process.on("end", function() {
                resolve(new_clip)
            })
            process.run()
        })
    })
}

module.exports = transform
