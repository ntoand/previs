import lavavu
lv = lavavu.Viewer()
print(lavavu.version)

lv.file('vol.xrw', name='volume')
lv.file('vol_web.json')

lv.interactive()