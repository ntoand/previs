// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  ws_url: 'http://118.138.241.179:3000',
  version: 'v0.6.1 dev',
  firebase: {
    apiKey: "AIzaSyDd6RZBynp_lsbJZ5N1IpO5IGPGcnFgBko",
    authDomain: "previs-dev.firebaseapp.com",
    databaseURL: "https://previs-dev.firebaseio.com",
    projectId: "previs-dev",
    storageBucket: "previs-dev.appspot.com",
    messagingSenderId: "862413634236"
  }
};
