var express = require("express");
var router = express();
var port = process.env.PORT || 3000;

var mongo = require('mongodb').MongoClient;

router.get("/:id", (req,res) => {
   
   mongo.connect('mongodb://localhost:27017/local', (err, db) => {
        if(err) throw err;
        
        var collection = db.collection('urls');
        
        collection.find({_id: parseInt(req.params.id)}).toArray((err,data) => {
            if(err) throw err;

            res.redirect(data[0].originalUrl);
            
            db.close();
        });
        
        
    });
});

router.get("/new/*", (req,res) => {
    
    mongo.connect('mongodb://localhost:27017/local', (err, db) => {
        if(err) throw err;
        
        var link = req.originalUrl;
        link = link.slice(5,link.length);
        
        var collection = db.collection('urls');
        var counter = db.collection('counter');
        
        collection.find({originalUrl: link}).toArray((err,data) => {
            if(err) throw err;

            data.length === 0 ? insertNewUrl(db, counter, collection, link, req, res) : showGeneratedUrl(db, data[0], req, res);
        });
            
          
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
            
        db.close();
    })

}

function showGeneratedUrl(db, data, req, res) {
    
    console.log(data);
    
    var resObject = {};
    resObject["originalUrl"] = data.originalUrl;
    resObject["shortUrl"] = req.hostname+"/"+data["_id"];
            
    res.send(resObject);
    
    db.close();
}