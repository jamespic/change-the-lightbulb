#!/usr/bin/python
from __future__ import division
import re, math, itertools
from wand.image import Image
from wand.color import Color


image_re = re.compile(r"(\w+) = (\d+) (\d+) (\d+) (\d+)[^\d]*")
#source_png = "platformer_graphics_deluxe/Tiles/tiles_spritesheet.png"
#source_png = "platformerGraphics_mushroomLand/PNG/spritesheet.png"
source_png = "platformer_graphics_deluxe/Enemies/enemies_spritesheet.png"
#source_txt = "platformer_graphics_deluxe/Tiles/tiles_spritesheet.xml"
#source_txt = "platformerGraphics_mushroomLand/PNG/spritesheet.xml"
source_txt = "platformer_graphics_deluxe/Enemies/enemies_spritesheet.txt"
scale_factor = 5/7
tilesets = ["blocker", "fish", "fly", "poker", "slime", "snail"]

with open(source_txt) as f:
    files = []
    for line in f:
        match = image_re.search(line)
        if match:
            filename = match.group(1)
            x = int(match.group(2))
            y = int(match.group(3))
            w = int(match.group(4))
            h = int(match.group(5))
            files.append((filename, x, y, w, h))

groups = {}
for filename, x, y, w, h in files:
    for tileset in tilesets:
        if filename.startswith(tileset):
            groups.setdefault(tileset, []).append((filename, x, y, w, h))
            break
    else:
        raise Exception()
        
with Image(filename=source_png) as source:
    for groupname, tiles in groups.iteritems():
        width = max(tiles, key = lambda x: x[3])[3]
        height = max(tiles, key = lambda x: x[4])[4]
        if scale_factor != 1.0:
            width = int(math.ceil(width * scale_factor))
            height = int(math.ceil(height * scale_factor))
        print "Groupname: " + groupname
        print "Width: " + str(width)
        print "Height: " + str(height)
        
        dest = Image(width = width * len(tiles),
                     height = height,
                     format = "RGBA",
                     background = Color("RGBA(0,0,0,0)"))

        for i, row in enumerate(tiles):
            filename, x, y, w, h = row
            src_img = source.clone()
            src_img.crop(left=x, top=y, width=w, height=h)
            if scale_factor != 1.0:
                h = int(math.ceil(h * scale_factor))
                w = int(math.ceil(w * scale_factor))
                src_img.resize(w, h)
            left_padding = int((width - w) / 2)
            top_padding = height - h
            #print "Placed object at {}, {}".format(xpos, ypos)
            dest.composite(src_img,
                           left = i * width + left_padding,
                           top = top_padding)

        dest.save(filename = groupname + ".png")
