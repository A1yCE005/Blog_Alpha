---
title: "Some Foundemental Tests"
date: 2024-09-22T21:52:53+08:00
excerpt: It should work, hopefully.
---

# Test Content
---
**Bold** and *Italic* test

Test of word with [Link](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

>Stay hungry, stay foolish.
>
>*Steve Jobs*



`This is inline code`

```py
def get_image_aspect_ratios_and_buckets(folder_path, bucket_resolutions):
    aspect_ratios_count = defaultdict(int)
    bucket_count = defaultdict(int)

    for filename in os.listdir(folder_path):        
        file_path = os.path.join(folder_path, filename)
             
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            try:
                with Image.open(file_path) as img:
                    width, height = img.size
                    aspect_ratio = calculate_aspect_ratio(width, height)
                    aspect_ratios_count[aspect_ratio] += 1
                    
                    closest_bucket = get_bucket_for_resolution(width, height, bucket_resolutions)
                    bucket_count[closest_bucket] += 1
            except Exception as e:
                print(f"Can not deal with image {filename}: {e}")

    return aspect_ratios_count, bucket_count
```



1. Ordered list
2. Content 1
3. Content 2

- Unordered list
    - Content 1
    - Content 2

$$ e^{i\pi} + 1 = 0 $$

$$ \varphi = 1+\frac{1}{1+\frac{1}{1+\cdots}} $$



[![Test-Image.jpg](https://i.postimg.cc/PxSfdtZ0/Test-Image.jpg)](https://postimg.cc/BL1fgfmC)
