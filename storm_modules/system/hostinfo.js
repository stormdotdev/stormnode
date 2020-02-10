module.exports = {
            custom_signature: null, // not yet used - rsa public key or null
            run: function(){
                  return new Promise(function(resolve, reject) {

                              const os = require('os');

                              //https://github.com/sebhildebrandt/systeminformation
                              const si = require('systeminformation');

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


                              Promise.all([
                                          si.getStaticData(),
                                          si.fsSize()
                                          ]).then(values => {

                                                //getStaticData
                                                var staticData = values[0];


                                                //fsSize
                                                var fsSize = values[1];
                                                var disks = [];
                                                for (const disk of fsSize) {
                                                      disks.push([disk.mount, disk.size]);
                                                }

                                                const result = {
                                                      hostname: hostname,
                                                      manufacturer: staticData.system.manufacturer,
                                                      model: staticData.system.model,
                                                      serial: staticData.system.serial,
                                                      arch: arch,
                                                      cpus: cpusList,
                                                      cpumanufacturer: staticData.cpu.manufacturer,
                                                      cpubrand: staticData.cpu.brand,
                                                      platform: platform,
                                                      distro: staticData.os.distro,
                                                      release: release,
                                                      totalmem: totalmem,
                                                      humanTotalMem: humanTotalMem,
                                                      uptime: uptime,
                                                      disks: disks
                                                }
                                                resolve(result);

                                          });


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
