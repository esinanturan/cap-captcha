# Standalone server

> [!WARNING]  
> **You are viewing the docs for a legacy version of Cap's Standalone server.** It is no longer actively maintained and will only receive critical security updates. While v1 is still tagged and pullable, certain commands below might not work anymore.    
> [New docs](standalone/index.md)

## Installation

Cap Standalone is a self-hosted version of Cap's backend that allows you to spin up a server to validate and create challenges so you can use it with languages other than JS.

To install Cap Standalone, you need to have [Docker](https://docs.docker.com/get-docker/) installed on your server. Once you have it installed, you can run the following command to pull the image:

```bash
docker pull tiago2/cap:latest
```

> [!NOTE] Both `x86_64` (amd64) and `arm64` architectures are supported. Docker Engine 20.10 or higher is recommended

Then, to run the server, use the following command:

```bash
docker run -d \
  -p 3000:3000 \
  -v cap-data:/usr/src/app/.data \
  -e ADMIN_KEY=your_secret_key \
  --name cap-standalone \
  tiago2/cap:latest
```

This will start the server on port 3000 and create a `cap-standalone` folder in your current directory to store the data. Change the port if needed.

Make sure to replace `your_secret_key` with a strong secret key, as anyone with it will be able to log into the dashboard and create keys.

Then, you can access the dashboard at `http://localhost:3000`, log in, and create a key. The key ID and secret will be used to configure the widget and verify the token on your server. You'll also need to make the server publicly accessible from the internet, as the widget needs to be able to reach it.

### CORS

You can change the default CORS settings for redeeming tokens, generating challenges and serving assets by setting the `CORS_ORIGIN` environment variable when running the server. This defaults to `*`, which allows all origins. This will directly assign to Access-Control-Allow-Origin header.

## Usage

### Client-side

First, add the Cap widget to your website by following [this guide](widget.md).

Then, you need to configure the widget to use your self-hosted Cap Standalone server. To do this, set the widget's API endpoint option to:

```
https://<instance_url>/<key_id>/api/
```

Make sure to replace:

- `<instance_url>`: The actual URL where your Cap Standalone instance is running. This URL must be publicly accessible from the internet.
- `<key_id>`: Your key ID from this dashboard.

Example:

```html
<cap-widget
  data-cap-api-endpoint="https://cap.example.com/d9256640cb53/api/"
></cap-widget>
```

> [!TIP]  
> Does generating challenges not work? Make sure your server is publicly accessible and that `CORS_ORIGIN` is set correctly to allow requests from your website's origin.

### Server-side

After a user completes the CAPTCHA on your site, your backend needs to verify their token using this server's API.

You can do this by sending a `POST` request from your server to the following endpoint:

```
https://<instance_url>/<key_id>/siteverify
```

Your request needs to include the following data:

- `secret`: Your key secret from this dashboard
- `response`: The CAPTCHA token generated by the widget on the client-side

Example using `curl`:

```bash
curl "https://<instance_url>/<key_id>/siteverify" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{ "secret": "<key_secret>", "response": "<captcha_token>" }'
```

Remember to replace:

- `<instance_url>`: This server's URL
- `<key_id>`: Your key ID from this dashboard
- `<key_secret>`: Your key secret from this dashboard
- `<captcha_token>`: The token value received from the client

The response should look like this:

```json
{
  "success": true
}
```

If `success` is true, you can proceed with your app logic.

### Client-side library storage

By default, Cap Standalone updates and stores multiple files for Cap's client-side `cap.js/widget` library. This helps Cap be truly self-hosted and not depend on any external resources.

These files are stored in the `.data` folder and exposed in the following paths:

- /assets/widget.js
- /assets/floating.js
- /assets/cap_wasm_bg.wasm
- /assets/cap_wasm.js

You can use these in your app by setting the widget's script source to the appropriate path, like this:

```html
<script src="https://<server url>/assets/widget.js"></script>
```

For the floating mode, use:

```html
<script src="https://<server url>/assets/floating.js"></script>
```

And by setting `window.CAP_CUSTOM_WASM_URL` to the path of the `cap_wasm_bg.wasm` file, like this:

```js
window.CAP_CUSTOM_WASM_URL = "https://<server url>/assets/cap_wasm_bg.wasm";
```

You can and should also change the version of the widget and WASM files by setting `process.env.WIDGET_VERSION` and `process.env.WASM_VERSION`. This will help you avoid breaking changes in the future.

By default, these fetch from `process.env.CACHE_HOST`. You can change this by setting the `CACHE_HOST` environment variable when running the server. If you don't set it, it defaults to `https://cdn.jsdelivr.net`. You can also set it to `disable` to disable the assets server entirely.
