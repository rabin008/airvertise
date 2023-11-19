# airvertise-core

This repo contains the smart contracts that are used for the **airvertise** protocol. Explain more... (pending)

## Prerequisites

- [node.js](https://nodejs.org/en/) 16.x. Consider using `nvm` Node manager
- [npm](https://www.npmjs.com/)

## Instructions

### Development

Clone the project:

```
git clone "https://github.com/airvertise/core"
```

Go to the project directory:

```
cd core
```

Install dependencies using npm:

```
npm install
```

Before running any hardhat command, you can complete the information of the *.env* file following the *.env_example* file. Compile the contracts with the following command:

```
npx hardhat compile
```

Then, if you want to start a local node to test the contracts against an application:

```
npx hardhat node
```

And then use the following command to deploy the contracts locally:

```
npx hardhat deploy --network localhost
```

Or, if you could also use the following script if you'd like to play with it a bit more:

```
npx hardhat run --network localhost scripts/deploy-test-campaign-creation.js
```

Note you will need to point your application to hardhat's local RPC node:

```
export RPC_NODE = "http://127.0.0.1:8545/"
```

## Deploy

This repo uses the [hardhat_deploy](https://github.com/wighawag/hardhat-deploy) plugin. For this reason, the deploy scripts are found in the deploy folder. To deploy them locally, run the following command:

```
npx hardhat deploy
```

## Tests

We used the hardhat framework for testing, you can check our tests in the test folder. To run them locally, use the following command:

```
npx hardhat test
```

## Development guidelines

### Branches

A branch of **develop** and another **master** will be used for each module.
For each ticket assigned, a new branch must be created from develop, which will then be integrated by using a Pull Request (PR):
The branch name must follow the following format:

* Fixes: fix/<fix_name>
* Feature: feature/<feature_name>
* Documentation: documentation/<documentation_name>

An example to create a new branch for a feature:

```bash
git checkout develop
git pull
git checkout -b feature/<#issue_number>-<fix_name>
```

### Commits

It is recommended to generate a commit for each change. Commits can have from one to several files, but it is recommended not to have too many related files in a single commit. This eases visibility when performing the Code Review.
Once the task is finished, commit and push this change to the issue branch in your forked repository (not develop nor master yet).

### VSCode configuration
If you use VSCode, you must have a configuration like this:

```JSON
{
  "editor.formatOnSave": true,
  "solidity.formatter": "prettier",
  "[solidity]": {
    "editor.defaultFormatter": "JuanBlanco.solidity"
  }
}
```
Make sure you have installed the following extension: [JuanBlanco.solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)