const checksum_lib = require('./paytm/checksum/checksum')
const port = 5000
let params ={}
module.exports=(app)=>{
    app.get('/payment-ok',(req,res)=>{
        if(req.isAuthenticated()){
        params['MID'] = 'DeVMZt89045305433029',
        params['WEBSITE'] = 'WEBSTAGING',
        params['CHANNEL_ID'] = 'WEB',
        params['INDUSTRY_TYPE_ID'] = 'Retail',
        params['ORDER_ID'] = Date.now().toString(),
        params['CUST_ID'] = 'CUST0012441',
        params['TXN_AMOUNT'] = '1',
        params['CALLBACK_URL'] = 'http://localhost:'+port+'/callback'
       

        checksum_lib.genchecksum(params,'!85u6UgttlqDvXGR',function(err,checksum){
            let txn_url = "https://securegw.paytm.in/order/process"

            let form_fields = ""
            for(x in params)
            {
                form_fields += "<input type='hidden' name='"+x+"' value='"+params[x]+"'/>"

            }

            form_fields+="<input type='hidden' name='CHECKSUMHASH' value='"+checksum+"' />"

            var html = '<html><body><center><h1>Please wait! Do not refresh the page</h1></center><form method="post" action="'+txn_url+'" name="f1">'+form_fields +'</form><script type="text/javascript">document.f1.submit()</script></body></html>'
            res.writeHead(200,{'Content-Type' : 'text/html'})
            res.write(html)
            res.end()
        })
    } else{
        res.redirect("/log-in")
    }
    })

    app.post('/callback',function(req,res){
        var paytmParams=req.body;
        
        let checksum = req.body.CHECKSUMHASH;
        delete paytmParams['CHECKSUMHASH'];
        var isValidChecksum = checksum_lib.verifychecksum(paytmParams, "!85u6UgttlqDvXGR", checksum);
            if(isValidChecksum) {
                console.log("Checksum Matched");
            } else {
                console.log("Checksum Mismatched");
            }

        if(req.body.STATUS === "TXN_SUCCESS"){
        res.render("/pdf");
        }
        else{
            res.send(req.body.STATUS)
        }
        
    })
}