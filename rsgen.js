var http = require('http');
var options = {
  host: 'localhost',
  path: '/burst',
  port: 8125,
  method: 'POST',
  headers: {
  	"Content-Type": "application/x-www-form-urlencoded"
  }
};
var reqBody = "requestType=getAccountId&secretPhrase=";

function getAccountRS(passphrase,done){
	try{
		var req = http.request(options, function(response){
			var str = ''
			response.on('data', function (chunk) {
			    str += chunk;
			});

			response.on('end', function () {
	    		var reply = JSON.parse(str);
	    		if(reply.hasOwnProperty('accountRS')){
	    			done(reply.accountRS);
				};
			});
		});
	
		req.write(reqBody+passphrase);
		req.end();
	}
	catch(e){
		done("ERROR");
	}
}

var ip = "127.0.0.1";
var port = 8125;
var passphrase = "secret";
var pattern = "ADDR";
var letters = "0123456789abcdefghijklmnopqrstuvwxyz";
var letterRange = 2;
var bestAddr = "BURST";
var bestSecret = "";
var bestMatched = 0;

function search(passphrase, done){
	getAccountRS(passphrase, function(rs){
		var rsStr = rs.replace("BURST-","");
		rsStr = rsStr.replace(/-/g,"");
		for(var i=0 ; i<rsStr.length ; i++){
			if(pattern[i] == rsStr[i]){
				if(bestMatched < i){
					bestMatched = i;
					bestAddr = rs;
					bestSecret = passphrase;
					console.log("passphrase "+passphrase+" -> "+rs);
				}
			}
			else break;
		}
		done();
	});
}

function permutation(str) {
    var fn = function(active, rest, a) {
        if (!active && !rest)
            return;
        if (!rest) {
            a.push(active);
        } else {
            fn(active + rest[0], rest.slice(1), a);
            fn(active, rest.slice(1), a);
        }
        return a;
    }
    return fn("", str, []);
}

var arr = [];
var ndx = 0;
function searchPattern(){
	search(passphrase+arr[ndx], function(){
		if(bestMatched < pattern.length){
			if(ndx+1 < arr.length){
				ndx++;
				process.nextTick(function(){
					searchPattern(arr,ndx);
				});
			}
			else{
				letterRange++;
				if(letterRange < letters.length){
					arr = permutation(letters.substring(0,letterRange));
					ndx = 0;
					console.log("expanding permutation to "+letterRange+", got "+arr.length+" combinations to try");
					process.nextTick(function(){
						searchPattern();
					});
				}
				else{
					console.log("all permutation tried");
				}
			}
		}
		else{
			process.exit();
		}
	})
}

if(process.argv.length < 4){
	console.log("usage : node rsgen.js [Passphrase-Prefix] [pattern] <Burst-Wallet-IP> <Burst-Wallet-Port> ");
	console.log(" ");
	console.log("[ ] = mandatory , < > = optional");
	console.log("default wallet IP is 127.0.0.1, and default port is 8125 if you dont specify it");
	console.log("pattern is the string you want to look for in BURST-XXXX-XXXX, pattern = XXXX...");
	console.log("generator will add letter after passphrase-prefix");
}
else{
	passphrase = process.argv[2];
	pattern = process.argv[3].toUpperCase();
	bestSecret = passphrase;

	console.log("wallet IP : "+ip);
	console.log("wallet Port : "+port);
	console.log("using passprase prefix : "+passphrase);
	console.log("searching for pattern : BURST-"+pattern);

	arr = permutation(letters.substring(0,letterRange));
	searchPattern();
}

process.on('uncaughtException', function (exception) {
	arr = permutation(letters.substring(0,letterRange));
    searchPattern();
});

process.on('SIGINT', function() {
    console.log("Caught interrupt signal");
    console.log("best passphrase "+bestSecret+" -> "+bestAddr);
    process.exit();
});

/*
var arr = permutation("abcde");
console.log(arr);
*/

/*
while(bestMatched < pattern.length){
	search(passphrase+letters[letterIndex++]);
	if(letterIndex > letters.length-1){
		letterIndex = 0;
	}
}
*/
