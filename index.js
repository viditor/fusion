var path = require("path")
var Bluebird = require("bluebird")
var FluentFfmpeg = require("fluent-ffmpeg")

function fusion(clips)
{
    Bluebird.map(clips, function(clip)
    {
        return trim(clip)
            .then(scale)
            .then(sample)
    })
    .then(function(clips)
    {
        merge(clips)
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
    
        trimming.on("end", function()
        {
            clip.file = "./clips/" + clip.clip_id + ".mp4"
            clip.length = clip.length - clip.trim.left - clip.trim.right
            delete clip.trim
            resolve(clip)
        })
        trimming.on("error", function(error, stdout, stderr)
        {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        trimming.run()
    })
}

function scale(clip)
{
    var x = 1280
    var y = 720
    var color = "black"
    
    return new Bluebird(function(resolve, reject)
    {
        var scaling = new FluentFfmpeg()
        
        scaling.addInput(clip.file)
        scaling.withSize(x + "x" + y).withAutopadding(color)
        scaling.addOutput("./clips/" + clip.clip_id + "-" + x + "x" + y + ".mp4")
    
        scaling.on("end", function()
        {
            clip.file = "./clips/" + clip.clip_id + "-" + x + "x" + y + ".mp4"
            resolve(clip)
        })
        scaling.on("error", function(error, stdout, stderr)
        {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        scaling.run()
    })
}


function sample(clip)
{
    return new Bluebird(function(resolve, reject)
    {
        var sampling = new FluentFfmpeg()
        
        sampling.addInput(clip.file)
        sampling.withVideoFilters("setsar=sar=1/1")
        sampling.addOutput("./clips/" + clip.clip_id + "-1by1" + ".mp4")
        
        sampling.on("end", function()
        {
            clip.file = "./clips/" + clip.clip_id + "-1by1" + ".mp4"
            resolve(clip)
        })
        
        sampling.on("error", function(error, stdout, stderr)
        {
            reject(stderr.replace(/[\r\n]/g, "\n"))
        })
        
        sampling.run()
    })
}

function merge(clips)
{
    var merging = new FluentFfmpeg()
    
    for(var index in clips)
    {
        var clip = clips[index]
        merging.addInput(clip.file)
    }
    
    merging.on("end", function()
    {
        console.log("OK!")
    })
    merging.on("error", function(error, stdout, stderr)
    {
        console.log("stderr", stderr.replace(/[\r\n]/g, "\n"))
    })
    
    merging.mergeToFile("./clips/x.mp4", "./clips")
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

/*merge([
    {
        clip_id: '123',
        file: './clips/123.mp4',
        length: 6.0600000000000005
    },
    {
        clip_id: '456',
        file: './clips/456.mp4',
        length: 7.0600000000000005
    }
])*/
