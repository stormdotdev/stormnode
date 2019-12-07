<p align="center"><img src="https://user-images.githubusercontent.com/24509741/70376213-d149e300-1906-11ea-9497-c6505c798cdb.png"></p>

# Stormclient
![Version](https://img.shields.io/github/package-json/v/joinstormio/stormclient)  ![License](https://img.shields.io/github/license/joinstormio/stormclient)   [![Open Source Love](https://badges.frapsoft.com/os/v2/open-source.png?v=103)](https://github.com/ellerbrock/open-source-badges/)
![Size](https://img.shields.io/github/size/joinstormio/stormclient/stormclient.js)
NodeJs client for joinstorm node net

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites

 - You must have an account on joinstorm.io to access our network. Please register [here](https://joinstorm.io/register) to join our community
 - NodeJs & npm

## Setup
> npm install -g stormclient

Check installation with:
> stormclient --version

## Local Install

clone this repo:
> git clone https://github.com/joinstormio/stormclient.git

> cd stormclient

> npm install

## Configuration

### simple method
> download the json configuration file from your client page [here](https://joinstorm.io/myclients) and put it in the same folder as stormclient.js

### alternative
create a stormclient.json file composed like this:
```json
{
    "username": "client1",
    "password": "password1",
    "clientId": "user-client1-client1"
}
```

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/joinstormio/stormclient/tags).

## Authors

* **joinstorm.io** - [joinstorm.io](https://joinstorm.io)

See also the list of [contributors](https://github.com/joinstormio/stormclient/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
