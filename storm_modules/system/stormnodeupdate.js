const path = require('path');
const cp = require('child_process');

module.exports = {
  custom_signature: null, // not yet used - rsa public key or null
  nodeOptions: null,
  setNodeOptions: function(nodeOptions){
    this.nodeOptions = nodeOptions;
  },
  run: function() {
    if (!this.nodeOptions.allow_remote_update) {
      return Promise.reject();
    }

    return new Promise(function (resolve, reject) {
      let string_return = '';
      process.chdir(path.dirname(path.dirname(__dirname)));
      let child1 = cp.spawnSync('git', ['pull']);
      let child2 = cp.spawnSync('npm', ['install']);
      resolve([
            child1.stdout + child2.stdout,
            child1.stderr + child2.stderr
      ].join(''));
      setTimeout(function () {
        return process.exit(0);
      }, 3000);
    });
  }
};
