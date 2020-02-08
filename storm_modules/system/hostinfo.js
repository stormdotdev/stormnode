module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                  return new Promise(function(resolve, reject) {

                              const os = require('os');

                              var cpusList = [];

                              var arch = os.arch();
                              var cpus = os.cpus();
                              var hostname = os.hostname();
                              var platform = os.platform();
                              var release = os.release();
                              var totalmem = os.totalmem();
                              var uptime = os.uptime();

                              for (var i in cpus) {
                                cpusList.push(cpus[i].model);
                              }
                              var humanTotalMem = humanFileSize(totalmem);

                              const result = {
                                    hostname: hostname,
                                    arch: arch,
                                    cpus: cpusList,
                                    platform: platform,
                                    release: release,
                                    totalmem: totalmem,
                                    humanTotalMem: humanTotalMem,
                                    uptime: uptime,
                              }
                              resolve(result);

                              //https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string/14919494#14919494
                              function humanFileSize(bytes, si) {
                                  var thresh = si ? 1000 : 1024;
                                  if(Math.abs(bytes) < thresh) {
                                     return bytes + ' B';
                                  }
                                  var units = si
                                     ? ['kB','MB','GB','TB','PB','EB','ZB','YB']
                                     : ['KiB','MiB','GiB','TiB','PiB','EiB','ZiB','YiB'];
                                  var u = -1;
                                  do {
                                     bytes /= thresh;
                                     ++u;
                                  } while(Math.abs(bytes) >= thresh && u < units.length - 1);
                                  return bytes.toFixed(1)+' '+units[u];
                              }

                        })
                  }
}
