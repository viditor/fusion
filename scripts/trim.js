var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function trim(clip)
{
    return new Bluebird(function(resolve, reject)
    {
        var process = new Fluently()
        
        var new_clip = {
            "file": "./clips/" + ShortID.generate() + ".mp4"
        }
        
        process.input(clip.file)
        process.output(new_clip.file)
        process.complexFilter([
            {
                "filter": "trim",
                "options": {
                    "start": clip.trim.left,
                    "end": clip.duration - clip.trim.right
                },
                "inputs": "0:v",
                "outputs": "nv:1"
            },
            {
                "filter": "atrim",
                "options": {
                    "start": clip.trim.left,
                    "end": clip.duration - clip.trim.right
                },
                "inputs": "0:a",
                "outputs": "na:1",
            },
            {
                "filter": "setpts",
                "options": "PTS-STARTPTS",
                "inputs": "nv:1",
                "outputs": "nv:2"
            },
            {
                "filter": "asetpts",
                "options": "PTS-STARTPTS",
                "inputs": "na:1",
                "outputs": "na:2"
            }
        ], ["nv:2", "na:2"])
        
        process.on("error", function(error, stdout, stderr)
        {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        process.on("end", function()
        {
            resolve(new_clip)
        })
        
        process.run()
    })
}

module.exports = trim
