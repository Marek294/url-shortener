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
        if (err) throw err;
        if (data.length == 0) { console.log("Invalid Id: " + req.params.id); return; };

        res.redirect(data[0].originalUrl);
    });
});

router.get("/new/:addr(*)", (req,res) => {

    var link = req.params.addr;
    
    var collection = db.collection('urls');
    var counter = db.collection('counter');
    
    collection.find({originalUrl: link}).toArray((err, data) => {
        if (data.length === 0)
            showGeneratedUrl(db, data[0], req, res);
        else
            insertNewUrl(db, counter, collection, link, req, res);
    });
});

router.listen(port, () => {
    console.log("Server listening at port "+port);
})

function insertNewUrl(db, counter, collection, link, req, res){
    counter.update(
          { "_id": "counterid" },
          { "$inc": { seq: 1 } }
        ); 
    
    counter.find({}).toArray((err,data) => {
        if(err) throw err;
        
        collection.insert({_id: data[0].seq, originalUrl: link});
            
        var resObject = {};
        resObject["originalUrl"] = link;
        resObject["shortUrl"] = req.hostname+"/"+data[0].seq;
            
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