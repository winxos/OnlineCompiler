var fs = require('fs')
var exec = require('child_process').exec
var express = require('express');
var router = express.Router();
var util = require('util');
var moment = require("moment");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});
router.get('/logs',function(req, res, next) {
    fs.readFile("log.txt", 'utf-8', function(err,data) {
        if(err)
        {
            console.log(err);
        }
        else
        {
            var ret='<h1><a href="/">back</a></h1><br><textarea cols="80" style="width:100%;height:80%">';
            var ts=data.split(";");
            for (var s in ts)
            {
                ret+=ts[s]+"\n";
            }
            ret+="</textarea>"
            res.send(ret);
        }
    });
});
router.post('/compiler', function(req, res, next) {
    //console.log(req);
    var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     req.connection.socket.remoteAddress;
     fs.appendFile("log.txt",moment().format("YYYY-MM-DD HH:mm:ss") +" ["+ip+"] "+req.body.langs+";", 
     function(err) {}
     );
    var langs = {
        "python": {
            suffix: ".py",
            cmd: "python _tmp.py"
        },
        "c": {
            suffix: ".c",
            cmd: "gcc -o _tmpc _tmp.c;./_tmpc"
        },
        "cpp": {
            suffix: ".cpp",
            cmd: "g++ -o _tmpcpp _tmp.cpp;./_tmpcpp"
        },
        "bash": {
            suffix: ".sh",
            cmd: "sh _tmp.sh"
        },
        "java":{
            suffix:".java",
            cmd:"javac test.java;java test"
        }
    };

    if (req.body.langs in langs) {
        var fn = '_tmp' + langs[req.body.langs].suffix;
        if(req.body.langs =="java")
        {
            fn="test.java";
        }
        var limitword = ["sudo", "rm", "mv", "mkfs", "dd", "sh"];
        var limitflag = false;
        var t = req.body.code.split(new RegExp('[;\n\r ]', 'g'));
        for (var i in limitword) {
            if (t.indexOf(limitword[i]) !=-1) {
                limitflag = true;
                console.log(limitword[i]);
                break;
            }
        }
        if (limitflag) {
            res.json(JSON.stringify({
                ans: "your operation is not allowed,DO NOT USE THEM!",
                time: 0
            }));
        }
        else {
            fs.writeFile(fn, req.body.code, function(err) {
                if (err) {
                    return console.error(err);
                }
                var start = +new Date();
                var ret = "";

                var cmd = exec(langs[req.body.langs].cmd);
                cmd.stdout.on('data', function(data) {
                    //console.log('stdout: ' + data);
                    ret += data;
                });
                cmd.stderr.on('data', function(data) {
                    console.log('[err]' + data);
                    if (req.body.detail == "true") {
                        ret += data;
                    }
                });
                cmd.on('exit', function(code) {
                    var end = +new Date();
                    //console.log(end - start);
                    res.json(JSON.stringify({
                        ans: ret,
                        time: end - start
                    }));
                    exec("rm _tmp*"); //clean
                });

            });
        }
    }

});
module.exports = router;
