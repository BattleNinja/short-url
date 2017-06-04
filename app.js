const express = require('express');
const engines = require('consolidate');
const assert = require('assert')
const MongoClient = require('mongodb').MongoClient;
const app = express();

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');



const errhandler = (err, req, res, next) => {
  console.error(err.message);
  console.error(err.stack);
  res.status(500).render('error_tempelate', {
    'error': err
  })
}

app.get('/', (req, res, next) => {
  res.render('index');
});


app.get('/new/:url(*)', (req, res, next) => {
  const pattern = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/gi;
  if (!pattern.test(req.params.url)) {
    next('Please input a valid URL')
  } else {
    const url = 'mongodb://localhost:27017/shorturl';
    console.log(req.params.url)
    MongoClient.connect(url, (err, db) => {
      if (err) {
        next('connection problem')
      } else {
        console.log('successfully connnect to database')
        db.collection('url').find({
          "original_url": req.params.url
        }).toArray((err, doc) => {
          if (err) {
            console.log(error);
          } else if (doc.length === 0) {
            let short_url = Math.floor(Math.random() * 10000);
            console.log(short_url);
            db.collection('url').insert({
              "original_url": req.params.url,
              "short_url": "https://localhost:3000/" + short_url
            }, (err, result) => {
              if (err) {
                console.log(err)
              } else {
                res.send({
                  "original_url": req.params.url,
                  "short_url": "https://localhost:3000/" + short_url
                });
              }
              db.close();
              console.log('db close')
            })
          } else {
            res.send('have recorded this doc')
          }
          db.close();
        });


      }
    })
  }
});


app.get('/:shorturl', (req, res, next) => {
  const pattern = /\d+/;
  if (!pattern.test(req.params.shorturl)) {
    next('not a valid shorturl')
  } else {
    const url = 'mongodb://localhost:27017/shorturl';
    MongoClient.connect(url, (err, db) => {
      if (err) {
        console.log(err)
      } else {
        console.log('successfully connect to database')
        db.collection('url').find({
          "short_url": "https://localhost:3000/" + req.params.shorturl
        }).toArray((err, doc) => {
          if (err) {
            console.log(err);
          } else if (doc.length === 1) {
            res.redirect(doc[0].original_url)
          } else {
            next('Can not found')
          }
          db.close();

        });
      }
    })
  }
});


app.use(errhandler);


const server = app.listen(3000, () => {
  console.log('Server is listening to port %s', server.address().port);
});;;
