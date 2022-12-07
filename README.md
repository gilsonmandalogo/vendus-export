# vendus-export

It's an app to download a zip file containing a complete month of all documents from [Vendus](https://www.vendus.pt/).

## Usage

First you need to configure the following things:

| Config | Description | Example |
| ------ | ----------- | ------- |
| base-url | The base url of your Vendus instance | https://YOUR-COMPANY.vendus.pt/ |
| user | Vendus username | someUser |
| password | Vendus password | mySuperStrongPassword |

Use the following command to set each config: `vendus-export config <name> <value>`.

After that you are ready to use the `export` command, if you need any more details you can print all available help with `vendus-export -h`.