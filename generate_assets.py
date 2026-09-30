import zlib
import struct
import os

def make_png(width, height, bg_color, fg_color, fg_size):
    img_data = bytearray()
    
    x_start = (width - fg_size) // 2
    x_end = x_start + fg_size
    y_start = (height - fg_size) // 2
    y_end = y_start + fg_size
    
    # Let's draw an orange square with rounded-like look (a diamond/circle shape)
    # distance check for a nice round flame-like or circular badge
    radius = fg_size // 2
    center_x = width // 2
    center_y = height // 2
    
    for y in range(height):
        img_data.append(0) # Filter type 0
        dy = y - center_y
        for x in range(width):
            dx = x - center_x
            # Simple circle badge
            if dx*dx + dy*dy <= radius*radius:
                img_data.extend(fg_color)
            else:
                img_data.extend(bg_color)
                
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png.extend(struct.pack('>I', 13))
    png.extend(b'IHDR')
    png.extend(ihdr_data)
    png.extend(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data)))
    
    compressed = zlib.compress(img_data)
    png.extend(struct.pack('>I', len(compressed)))
    png.extend(b'IDAT')
    png.extend(compressed)
    png.extend(struct.pack('>I', zlib.crc32(b'IDAT' + compressed)))
    
    png.extend(struct.pack('>I', 0))
    png.extend(b'IEND')
    png.extend(struct.pack('>I', zlib.crc32(b'IEND')))
    
    return png

os.makedirs('assets', exist_ok=True)

with open('assets/icon.png', 'wb') as f:
    # 26,26,26 is Hex #1a1a1a. 249,115,22 is Hex #f97316
    f.write(make_png(1024, 1024, (26, 26, 26), (249, 115, 22), 400))

with open('assets/splash.png', 'wb') as f:
    f.write(make_png(2732, 2732, (26, 26, 26), (249, 115, 22), 600))

print("Asset PNGs generated successfully in assets/ directory.")
