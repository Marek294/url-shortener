var http = require('http');
var https = require('https');
var express = require("express");
var router = express();
var port = process.env.PORT || 3000;

var mongo = require('mongodb').MongoClient;
var db = undefined;

mongo.connect('mongodb://localhost:27017/local', (err, database) => {
    if(err) throw err;
    db = database;
});

router.get("/:id", (req,res) => {
    var collection = db.collection('urls');
    
    collection.find({_id: parseInt(req.params.id)}).toArray((err,data) => {
        if (err) { 
            console.log(err); 
            return;
        }
        if (data.length == 0) { 
            res.send("Invalid Url: " + req.params.id); 
            return; 
            
        }

        showWebsite(data[0].originalUrl, res);
    });
});

router.get("/new/:addr(*)", (req,res) => {
    
    var reg = new RegExp("http://+\.+/|https://+\.+/|http://www\.+\.+/|https://www\.+\.+/");

    var link = req.params.addr;
    
    if(reg.test(link)) {
    
        var collection = db.collection('urls');
        
        collection.find({originalUrl: link}).toArray((err, data) => {
            if(err) {
                console.log(err);
                return;
            }
            
            if (data.length === 0)
                insertNewUrl(db, collection, link, req, res);
            else
                showGeneratedUrl(db, data[0], req, res);
                
        });
    } else res.send("Wrong Url");
});

router.listen(port, () => {
    console.log("Server listening at port "+port);
})

function insertNewUrl(db, collection, link, req, res){
    
    collection.count({}, (err,counter) => {
        if(err) {
            console.log(err);
            return;
        }
        
        var id = parseInt(counter)+1;
        collection.insert({_id: id, originalUrl: link});
            
        var resObject = {};
        resObject["originalUrl"] = link;
        resObject["shortUrl"] = req.hostname+"/"+id;
            
        res.send(resObject);
    })

}

function showGeneratedUrl(db, data, req, res) {
    
    console.log(data);
    
    var resObject = {};
    resObject["originalUrl"] = data.originalUrl;
    resObject["shortUrl"] = req.hostname+"/"+data["_id"];
            
    res.send(resObject);
}

function showWebsite(link, response) {
    var regHttp = new RegExp("^http://");
    var regHttps = new RegExp("^https://");
    
    if(regHttp.test(link)) {
        http.get(link, function () {
            response.redirect(link);
        }).on('error', function(e) {
            response.send(link+" website doesn't exists!");
        })
    }
    else if(regHttps.test(link)) {
        https.get(link, function () {
            response.redirect(link);
        }).on('error', function(e) {
            response.send(link+" website doesn't exists!");
        })
    } else response.send(link+" website doesn't exists!");
}