# previs

Previsualisation tools for volumes, meshes, pointclouds, high resolution images 

This is a service provided by MIVP to Monash University staff and affiliates. 
It provides a way to upload volumetric, mesh pointcloud and high-res images data, visualise the data on a web page, and then allows people to visualise the volume in CAVE2/VR.

## How to install

### Web client (Angular app)

- Install node packages
```
cd client
npm install
npm install --only=dev
```

- Run dev mode
```
npm run dev
or
npm run start
```

- Run development mode
```
npm run build
```

### Server

- Rebuild sharevol (if needed)
```
cd server/public/sharevols
make
cp lib/sharevol-all.js sharevol.js
```

- Build PotreeConverter 
```
cd server/potree
./build.sh

cd server/potree/potree
npm install
gulp build
cd server/potree
./updatepotreeviewer.sh  (to copy potree previs build to pointviewer)
```

- Install npm packages
```
cd server
npm install
npm install --only=dev
```

- Set up firebase sdk https://firebase.google.com/docs/admin/setup
- Update server/src/node-config.js and client/src/enviroments/environment* if needed
- Setup path to sdk file in src/node-config.js
- Build client and run server 
```
./GO.sh
```

- Run server only
```
./GO-sever.sh
or
./GO-server-dev.sh for development
```

## Acknowledgement

- Firebase (Auth and Firestore)
- Potree (PotreeConveter, potree web viewer)
- Sharevol (WebGL volume viewer)
- Three.js (WebGL mesh viewer)
- OpenSeadragon (Javascript high-res image viewer)
- vips (to convert image to deep zoom format)


## Change log

### v0.5.0

- Can upload volume as stacked tif file
- Allow users to upload 16-bit tif data. 16-bit will be converted to 8-bit
- Add tiff extension for volume and image downloaded from a Google link
- Add advanced options for volume data (voxel size, timestep, channel index)

### v0.4.0

- Support high resolution image upload, view high-res images in web browser and CAVE2
- New json file structure for mesh folders
- Support MTL file with texture images
- Support more image types (in addition to tiff image, users can upload stack of jpg,png images)
- Faster volume data conversion
- Support high resolution volume viewing in the CAVE2 with Tuvok

### v0.3.0

- Support volume (tiffstack), mesh (obj) and pointcloud data
- Data can be imported from local machine, shared link or MyTardis
- View data in the CAVE2