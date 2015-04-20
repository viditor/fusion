var Bluebird = require("bluebird")

function flatten(protovideo) {
    return new Bluebird(function(resolve, reject) {
		protovideo.clips = replaceSpaceWithBlackness(protovideo.clips)
	    protovideo.clips = trimAndOverlay(protovideo.clips)
        resolve(protovideo)
    })
}

// Adds blackness in the space between clips
function replaceSpaceWithBlackness(clips)
{
    clips = JSON.parse(JSON.stringify(clips))
    var previousEndTick = 0;
    for (var i = 0; i < clips.length; i++)
    {
        var clip = clips[i];

        // If there is space between the beginning of this clip and the end of previous clip
        var timeBetweenPrevious = clip.tick - previousEndTick;
        if (timeBetweenPrevious > 0)
        {
            // Insert blackness for the duration of the space between clips
			clip = {
				track: 0,
				tick: previousEndTick,
				asset: {
                    file: null,
                    duration: timeBetweenPrevious
                },
				trim: {
					left: 0,
					right: 0
				}
			}
            clips.splice(i, 0, clip);
            i++;
        }
        previousEndTick = clip.tick + clip.asset.duration;
    }
    return clips;
}

// Cuts clips at boundary points and overlays when necessary
function trimAndOverlay(clips)
{
    clips = JSON.parse(JSON.stringify(clips))
    var pointClipLinks = getPointClipLinks(clips);

    var outputClips = [];
    var runningClips = [];
    var previousPoint = 0;

    // Sort the point keys from pointClipLinks in ascending numeric order
    var sortedPoints = Object.keys(pointClipLinks).sort(function(a, b)
    {
        return (a - b);
    });

    for (var spIndex = 0; spIndex < sortedPoints.length; spIndex++)
    {
        var point = sortedPoints[spIndex];

        var clipBuffer = [];
        for (var rcIndex = 0; rcIndex < runningClips.length; rcIndex++)
        {
            var runningClip = runningClips[rcIndex];
            var outputClip = cloneClip(runningClip);
            alignClip(outputClip, previousPoint, point);
            clipBuffer.push(outputClip);
        }

        if (clipBuffer.length == 1)
        {
            // Add a single clip
			delete clipBuffer[0].tick
			delete clipBuffer[0].track
            outputClips.push([clipBuffer[0]]);
        }
        else if (clipBuffer.length > 0)
        {
            // Sort subclips by track ascending
            var subclips = clipBuffer.sort(function(a, b)
            {
                return (a.track - b.track);
            });
			for(var index in subclips) {
				var subclip = subclips[index]
				delete subclip.tick
				delete subclip.track
			}
            outputClips.push(subclips);
        }

        var clipLinks = pointClipLinks[point];

        for (var clIndex = 0; clIndex < clipLinks.length; clIndex++)
        {
            var clipLink = clipLinks[clIndex];
            if (clipLink["type"] == "start")
            {
                runningClips.push(clipLink.clip);
            }
            else if (clipLink["type"] == "end")
            {
                var clipIndex = runningClips.indexOf(clipLink.clip);
                if (clipIndex != -1)
                {
                    runningClips.splice(clipIndex, 1);
                }
            }
        }

        previousPoint = point;
    }
    return outputClips;
}

// Builds a map of points associated with (clip and point type) lists
function getPointClipLinks(clips)
{
    var pointClipLinks = {};
    for (var i = 0; i < clips.length; i++)
    {
        var clip = clips[i];
        var leftSide = clip.tick + clip.trim.left;
        var rightSide = clip.tick + clip.asset.duration - clip.trim.right;

        pointClipLinks = addToListInMap(pointClipLinks, leftSide, {"clip": clip, "type": "start"});
        pointClipLinks = addToListInMap(pointClipLinks, rightSide, {"clip": clip, "type": "end"});
    }

    return pointClipLinks;
}

// Adds a value to a map as if it were a multimap
function addToListInMap(map, key, value)
{
    var list = (key in map) ? map[key] : [];
    list.push(value);
    map[key] = list;
    return map;
}

// Sets left and right trim of a clip to align it to the specified absolute start and end times
function alignClip(clip, targetStart, targetEnd)
{
    var actualStart = clip.tick;
    var actualEnd = clip.tick + clip.asset.duration;

    clip.trim.left = targetStart - actualStart;
    clip.trim.right = actualEnd - targetEnd;

    return clip;
}

// Creates a clone of a clip object
function cloneClip(clip) {
    return JSON.parse(JSON.stringify(clip));
}

module.exports = flatten

//todo: clean up some of the mess.
//todo: sort before processing.
