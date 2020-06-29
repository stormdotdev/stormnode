const path = require('path');
const fs = require('fs');

module.exports = {
  nodeOptions: null,
  arguments: null,
  setNodeOptions: function (nodeOptions) {
    this.nodeOptions = nodeOptions;
  },
  setArguments: function (arguments) {
    this.arguments = arguments;
  },
  run: function () {
    if (this.nodeOptions.allow_remote_plugins_installation == 0) {
      return Promise.reject({
        error_message: 'plugin installation is not allowed'
      });
    }

    return new Promise((resolve, reject) => {
      try {
        const installPath = path.join('storm_modules/custom', this.arguments.installation_name);
        const commands = [];

        if (!fs.existsSync(installPath)) {
          commands.push({
            command: 'git clone ' + this.arguments.repository + ' ' + this.arguments.installation_name,
            path: 'storm_modules/custom'
          });
        } else {
          commands.push({
            command: 'git pull',
            path: installPath
          });
        }

        commands.push({
          command: 'npm install --production',
          path: installPath
        });

        let string_return = '';
        const { exec } = require('child_process');

        const exec_commands = (commands) => {
          const commandConfig = commands.shift();
          exec(commandConfig.command, { cwd: commandConfig.path }, (error, stdout, stderr) => {
            if (stdout) {
              string_return += stdout;
            }

            if (stderr) {
              string_return += stderr;
            }

            if (commands.length) {
              exec_commands(commands);
            } else {
              resolve(string_return);
            }
          });
        };

        exec_commands(commands);
      } catch (e) {
        console.log(e);
        reject({
          error: e.toString()
        });
      }
    });
  }
}
