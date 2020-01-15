<p align="center"><img src="https://user-images.githubusercontent.com/24509741/70376213-d149e300-1906-11ea-9497-c6505c798cdb.png"></p>

# Stormclient
![Version](https://img.shields.io/github/package-json/v/joinstormio/stormclient)  ![License](https://img.shields.io/github/license/joinstormio/stormclient)   [![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.png?v=103)](https://github.com/ellerbrock/open-source-badges/)
![Size](https://img.shields.io/github/size/joinstormio/stormclient/stormclient.js)

NodeJs node for storm.dev node net

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

 - You must have an account on storm.dev to access our network. Please register [here](https://joinstorm.io/register) to join our community
 - NodeJs & npm

## Setup
> npm install -g stormnode

Check installation with:
> stormnode --version

## Local Install

clone this repo:
> git clone https://github.com/stormdotdev/stormnode.git

> cd stormnode

> npm install

## Configuration

### simple method
> download the json configuration file from your node page [here](https://storm.dev/mynodes) and put it in the same folder as stormnode.js

### alternative
create a stormnode.json file composed like this:
```json
{
    "username": "user1",
    "password": "password1",
    "nodeId": "user-node1-node1"
}
```

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/joinstormio/stormclient/tags).

## Authors

* **storm.dev** - [storm.dev](https://storm.dev)

See also the list of [contributors](https://github.com/stormdotdev/stormclient/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
