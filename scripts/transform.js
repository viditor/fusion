var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function transform(video, clips)
{
    return new Bluebird(function(resolve, reject)
    {
        //handle null position/dimensions
            //video
                //if no dimensions
                    //1280x270 oooor throw
                //if no color
                    //black
            //clip
                //if no position or dimensions?
                    //center in canvas
                //if no position, but has dimensions?
                    //0x0? or center?
                //if no dimensions, but position? <- rename to scale
                    //do not scale? yeah, go from probe
                //if no trim?
                    //do not trim?
        
        var process = new Fluently()
        
        var new_clip = {
            "clip_id": ShortID.generate()
        }
        
        var filters = []
        
        filters.push({
            "filter": "color",
            "options": {
                "color": "0x" + (video.color || "000000"),
                "size": video.width + "x" + video.height
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
            process.addInput(clip.file)
            
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
                    "width": clip.dimensions.width,
                    "height": clip.dimensions.height
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
        
        new_clip.file = "./clips/" + new_clip.clip_id + ".mp4"
        process.addOutput(new_clip.file)
        
        process.complexFilter(filters, [video_output, audio_output])
        
        process.on("error", function(error, stdout, stderr)
        {
            //console.log(stdout.replace(/[\r\n]/g, "\n"))
            //console.log(stderr.replace(/[\r\n]/g, "\n"))
            reject(error)
        })
        
        process.on("end", function()
        {
            resolve(new_clip)
        })
        
        process.run()
    })
}

module.exports = transform
