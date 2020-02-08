# Storm system module
## hostmonitoring
Return basic information from host
* memory (total, used)
* cpu load (total cpus, cpu1, ...)
* disk (disk1, disk2, ...)

The hostmonitoring module totally uses the systeminformation library of [Sebastian Hildebrandt](https://github.com/sebhildebrandt)
[https://github.com/sebhildebrandt/systeminformation](https://github.com/sebhildebrandt/systeminformation) - systeminformation github page
[https://systeminformation.io/](https://systeminformation.io/) - systeminformation web page
Thanks!
return:
```json
{
      "memory": [
            17179869184,                  // total ram
            13996253184                   // used ram
      ],
      "cpus": [
            [
                  16.69023349494722,      // total cpus load percentage
                  10.288821095128597,     // total cpus user load percentage
                  6.4014123998186205      // total cpus system load percentage
            ],
            [
                  25.496262824925946,     // cpu1 load percentage
                  15.499856109617443,     // cpu1 user load percentage
                  9.996406715308506       // cpu1 system load percentage
            ],
            [
                  9.305088707343677,      // cpu2 load percentage
                  5.185420449594703,      // cpu2 user load percentage
                  4.119668257748973       // cpu2 system load percentage
            ],
            [
                  ...                     // cpuN
            ]
      ],
      "disks": [
            [
                  "/",                    // disk1 mount point
                  499963174912,           // disk1 total size
                  10818920448             // disk1 used size
            ],
            [
                  "/System/Volumes/Data", // disk2 mount point
                  499963174912,           // disk2 total size
                  236281159680            // disk2 used size
            ],
            [
                  ...                     // diskN
            ]
      ]
}

```


## hostinfo
Not require any external library, uses only os of nodejs

return:
```json
{
      "hostname": "stormlaptop3",
      "arch": "x64",
      "cpus": [
            "Intel(R) Core(TM) i5-8210Y CPU @ 1.60GHz",
            "Intel(R) Core(TM) i5-8210Y CPU @ 1.60GHz",
            "Intel(R) Core(TM) i5-8210Y CPU @ 1.60GHz",
            "Intel(R) Core(TM) i5-8210Y CPU @ 1.60GHz"
      ],
      "platform": "darwin",
      "release": "19.2.0",
      "totalmem": 17179869184,
      "humanTotalMem": "16.0 GiB",
      "uptime": 66124
}
```

## stormnodeuptime
return stormnode uptime

## stormnodeversion
return stormnode version

## stormnodeupdate
update the stormnode
