const fs = require('fs');
const path = require('path');

module.exports = {
      run: function(){
            return new Promise(function(resolve, reject) {
                  const customDir = path.join(path.dirname(__dirname), 'custom');
                  resolve(fs.readdirSync(customDir).filter(dirent => fs.statSync(path.join(customDir, dirent)).isDirectory()));
            });
      }
};
