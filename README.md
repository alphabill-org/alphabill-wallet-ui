# Getting Started with Alphabill Light Wallet


## Available Scripts

### `npm install` & for Node.js version 17 & up add `--openssl-legacy-provider` flag.
Installs dependencies for the project.

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser & uses devnet endpoints.\
The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run preview`

Runs the app locally to preview production build.\
Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

### `npm run build` to use testnet & `npm run build-dev` to use devnet endpoints

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\

See the section about [deployment](https://vitejs.dev/guide/static-deploy.html) for more information.

### `npm run build-local` to use local API endpoints

Builds the app to the `build` folder.\
Localhost API URLs:
* Money backend - `http://localhost:9654/api/v1`
* Money node - `http://localhost:26866/api/v1`
* UTP backend - `http://localhost:9735/api/v1`

### `npm run test`

Launches the test runner.

### `npm run test-watch`

Launches the test runner in the interactive watch mode.

## Add wallet as Chrome extension

Download the wallet build zip file under the given release assets & unpack it.

Open Your Extension in Chrome `chrome://extensions/`

In the top-right corner, turn on developer mode. This will then render two buttons in the top-left corner. Load the unpacked extension and the packed extension.

Click on “Load unpacked extension,” and select your unpacked `build` folder.

You could also install the modules `npm install --openssl-legacy-provider` then build it by using `npm run build` & select your newly created `build` folder. Using this method enables you to change the build. It will update automatically each time you use `npm run build`.
