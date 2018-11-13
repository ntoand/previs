import json

jsonfile = 'mesh.json'

import lavavu
lv = lavavu.Viewer()
print(lavavu.version)

#lv["trisplit"] = 1

# load groups/objects
obj = lv
with open(jsonfile, 'rt') as f:
    groups = json.load(f)
    groups = groups["objects"]
    print groups

    for group in groups:
        colour = group["colour"]
        alpha = group["alpha"]
        name = group["name"]
        visible = group["visible"]
        print("Creating:" + name)
        obj = lv.triangles(name)

        objects = group["objects"]
        for object in objects:
            fn = name + '/' + object["obj"]
            print fn
            obj.file(str(fn), colours=[colour])
            if visible: obj["opacity"] = 1.0

lv.interactive()
