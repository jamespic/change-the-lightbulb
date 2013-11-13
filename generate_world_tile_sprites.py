#!/usr/bin/python
from __future__ import division
import re, math, itertools
from wand.image import Image
from wand.color import Color


image_re = re.compile(
    r'name="(\w+)\.png"\s*x="(\d+)"\s*y="(\d+)"\s*width="(\d+)"\s*height="(\d+)"')
#source_png = "platformer_graphics_deluxe/Tiles/tiles_spritesheet.png"
#source_png = "platformerGraphics_mushroomLand/PNG/spritesheet.png"
source_png = "platformer_graphics_deluxe/Items/items_spritesheet.png"
#source_txt = "platformer_graphics_deluxe/Tiles/tiles_spritesheet.xml"
#source_txt = "platformerGraphics_mushroomLand/PNG/spritesheet.xml"
source_txt = "platformer_graphics_deluxe/Items/items_spritesheet.xml"
scale_factor = 5/7
#tilesets = ["dirt", "grass", "box", "castle", "liquid", "sand", "snow", "stone"]
tilesets = []

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
        newW = int(math.ceil(w * scale_factor))
        newH = int(math.ceil(h * scale_factor))
        groups.setdefault("{}x{}".format(newW, newH), []).append((filename, x, y, w, h))

with Image(filename=source_png) as source:
    for groupname, tiles in groups.iteritems():
        width = max(tiles, key = lambda x: x[3])[3]
        height = max(tiles, key = lambda x: x[4])[4]
        xtiles = int(math.ceil(math.sqrt(len(tiles))))
        ytiles = int(math.ceil(len(tiles) / xtiles))
        if scale_factor != 1.0:
            width = int(math.ceil(width * scale_factor))
            height = int(math.ceil(height * scale_factor))
        print "{} tiles - {}x{}".format(len(tiles),xtiles,ytiles)
        print "Width: " + str(width)
        print "Height: " + str(height)
        
        dest = Image(width = width * xtiles,
                     height = height * ytiles,
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
            left_padding = width - w if "Left" in filename else 0
            (ypos, xpos) = divmod(i, xtiles)
            #print "Placed object at {}, {}".format(xpos, ypos)
            dest.composite(src_img,
                           left = xpos * width + left_padding,
                           top = ypos * height)

        dest.save(filename = groupname + ".png")
