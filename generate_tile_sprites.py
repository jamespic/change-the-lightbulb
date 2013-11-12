#!/usr/bin/python
from __future__ import division
import re, math
from wand.image import Image
from wand.color import Color

image_re = re.compile(r"(\w+) = (\d+) (\d+) (\d+) (\d+)[^\d]*")
source_png = "platformer_graphics_deluxe/Player/p3_spritesheet.png"
source_txt = "platformer_graphics_deluxe/Player/p3_spritesheet.txt"
scale_factor = 5/7

with open(source_txt) as f:
    files = []
    for line in f:
        match = image_re.match(line)
        filename = match.group(1)
        x = int(match.group(2))
        y = int(match.group(3))
        w = int(match.group(4))
        h = int(match.group(5))
        files.append((filename, x, y, w, h))

width = int(math.ceil(max(row[3] for row in files) * scale_factor))
height = int(math.ceil(max(row[4] for row in files) * scale_factor))

print width, height

with Image(filename=source_png) as source:
    dest = Image(width = width * len(files),
                 height = height * 2,
                 format = "RGBA",
                 background = Color("RGBA(0,0,0,0)"))

    for i, row in enumerate(files):
        filename, x, y, w, h = row
        src_img = source.clone()
        src_img.crop(left=x, top=y, width=w, height=h)
        if scale_factor != 1.0:
            h = int(math.ceil(h * scale_factor))
            w = int(math.ceil(w * scale_factor))
            src_img.resize(w, h)
        top_padding = height - h
        left_padding = int((width - w) / 2)
        dest.composite(src_img,
                       left = i * width + left_padding,
                       top = top_padding)
        print '"{}_l": [{}, {}],'.format(filename, i, 0)
        src_img.flop()
        dest.composite(src_img,
                       left = i * width + left_padding,
                       top = height + top_padding)
        print '"{}_r": [{}, {}],'.format(filename, i, 1)

    dest.save(filename = "p3_sprites.png")
