var express = require('express')
var app = express();

app.use(express.json());

path = ('./route/route.js')

require(path)(app)

app.listen(3000, () => {
  console.log('Server is listening');
});
