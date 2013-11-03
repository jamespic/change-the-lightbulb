import re
from wand.image import Image
from wand.color import Color

image_re = re.compile(r"(\w+) = (\d+) (\d+) (\d+) (\d+)[^\d]*")
source_png = "assets/platformer_graphics_deluxe/Player/p1_spritesheet.png"
source_txt = "assets/platformer_graphics_deluxe/Player/p1_spritesheet.txt"

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

width = max(row[3] for row in files)
height = max(row[4] for row in files)

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
        top_padding = height - h
        left_padding = (width - w) / 2
        dest.composite(src_img,
                       left = i * width + left_padding,
                       top = top_padding)
        print '"{}_l": [{}, {}],'.format(filename, i, 0)
        src_img.flop()
        dest.composite(src_img,
                       left = i * width + left_padding,
                       top = height + top_padding)
        print '"{}_r": [{}, {}],'.format(filename, i, 1)

    dest.save(filename = "p1_sprites.png")
