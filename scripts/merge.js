var ShortID = require("shortid")
var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function merge(clips)
{
    return new Bluebird(function(resolve, reject)
    {
        var process = new Fluently()
        
        var new_clip = {
            "clip_id": ShortID.generate()
        }
        
        for(var index in clips)
        {
            var clip = clips[index]
            process.addInput(clip.file)
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

module.exports = merge
