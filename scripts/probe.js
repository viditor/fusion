var Bluebird = require("bluebird")
var Fluently = require("fluent-ffmpeg")

function probe(clip)
{
    return new Bluebird(function(resolve, reject)
    {
        Fluently.ffprobe(clip.file, function(error, data)
        {
            if(error)
            {
                reject(error)
            }
            else
            {
                clip.duration = data.format.duration
                resolve(clip)
            }
        })
    })
}

module.export = probe
