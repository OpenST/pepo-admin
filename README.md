# pepo-admin

## Pre-requisites for setting up environment

* Follow the steps in readme of pepo-api to setup nginx.

* Source the environment variables.
    ```bash
       source set_env_vars.sh
    ```

* Install package dependencies.
    ```bash
        npm install
    ```

* Precompile the assets.
    ```bash
        ./node_modules/.bin/connect-assets -gz
    ```

* Start the server. The server starts on port 4000. Admin login page is: 'pepodev.com:8080/admin/login'
   ```bash
        node bin/www
   ```
