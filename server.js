var http = require('http')

http.createServer(function(request, response) {  
    
    console.log("Incoming request...")

    response.writeHeader(200, {"Content-Type": "application/json"});  
    response.write('ok');  
    response.end();  
}).listen(8000);