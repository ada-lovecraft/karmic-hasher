#So, what is this?
----
Karmic Hash is an attempt to determine the relationship between an image's features and it's [karmic](http://reddit.com) score. 

* * *

###How do I use this thing?
Well, you can start by going to <http://hash.codevinsky.com/r/earthporn> (Totally safe for work. It's just amazing nature pictures). Pick a photo, and then use the slider to adjust relevancy. The lower the relevance number, the more similar the images must be. (So, an image that matches on a 0 is -exactly the same- image). I've found 23 to be the sweet spot where you get relevant images.

###Ok, cool, but I wanna try other subreddits!
That's fine with me, just point your browser to <http://hash.codevinsky.com/r/subreddit> and it'll start processing the images. There's a queue setup, so you can feel free to add as many as you want.

###I don't understand, the images don't seem similar…
The hashing algorithm uses formations in the image to create the hash. So, instead of color, it's looking at form. [/r/earthporn](http://hash.codevinsky.com/r/earthporn) is easy to see this in action. It's less apparent when looking at more macro shots like [/r/cats](http://hash.codevinsky.com/r/cats).

###Why are the thumbnails in black and white?
It's easier to see forms in an image when you're not trying to compare colors in an image.

###I still don't quite understand how this works.
HackerFactor has a good article about it that explains it an easy to understand way: [Looks Like It!](http://www.hackerfactor.com/blog/?/archives/432-Looks-Like-It.html) 

### How are you accomplishing this?
I'm hashing the top ~1000 most popular images from a subreddit in the past year.

### No, I mean… like… how?
Ok. I'm using a [node](http://nodejs.org) backend, a [perceptual hashing](http://phash.org) library ([github.com/aaronm67:node-phash](http://github.com/aaronm67/node-phash.git)), the [imgur](http://imgur.com) api, and a [couchbase](http://couchbase.com) datastore.

### Can I look at the source code?
Of course. It's on github ([github.com/codevinsky:karmic-hasher](http://github.com/codevinsky/karmic-hasher))

### Anything planned for the future of this project?
I dunno. Maybe? I've considered writing a service that will allow you to upload a photo and see which subreddit you should post it to (and the expected karmic outcome). 

### I've got questions…
Ok. Hit me up on twitter: ([@codevinsky](http://twitter.com/codevinsky)), email me (<jeremy@codevinsky.com>) or, I dunno, send a carrier pigeon?