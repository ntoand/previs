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
./updatepotreeviewer.sh
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
