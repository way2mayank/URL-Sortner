const mongoose = require('mongoose')
const urlModel = require('../model/urlModel')
const shortid = require('shortid')
// const validUrl = require('valid-url')
const redis = require("redis")
const { promisify } = require('util')

const validUrl = function (str) {
    var pattern = new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%.\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%\+.~#()?&//=]*)/igm);
    if (pattern.test(str)) return true;
};


//Connect to redis
const redisClient = redis.createClient(
    18200,
    "redis-18200.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("S2RUjZA3pDS2R4IN7l0Vjwxo8LtmWuxB", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);


const shortningUrl = async function (req, res) {
    try {
        let reqbody = req.body
        if (Object.keys(reqbody).length == 0)
            return res.
                status(400).
                send({ status: false, message: "Provide data in request body" })

        //******************* Distructering ********************************

        const { longUrl, ...rest } = reqbody

        if (Object.keys(rest).length > 0)
            return res.
                status(400).
                send({ status: false, message: "request body must contain only longUrl" })

        // ********************* Validation of Url *******************************

        if (!validUrl(longUrl))
            return res.
                status(400).
                send({ status: false, message: "Url is not valid" })

        // *************** Unickness Checking of longUrl *********************
       
       
        let hitUrl1 = await GET_ASYNC(`${longUrl}`)
        if (hitUrl1) {
            return res.
                status(200).
                    send({status:true,message:"Url is already present",data:JSON.parse(hitUrl1)})
        }


        const checkurl = await urlModel.findOne({ "longUrl": longUrl }).select({_id:0,createdAt:0,updatedAt:0,__v:0})
       

        if (checkurl) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(checkurl))
            
            return res.
                status(200).
                send({ status: true, message: "Url is already present", data: checkurl})
        }


        const urlCode = (shortid.generate(longUrl)).toLowerCase()
        const shortUrl = "localhost:3000/" + urlCode
       
        const createData = await urlModel.create({ longUrl, shortUrl, urlCode })
        let createselected={
            longUrl:createData.longUrl,
            shortUrl:createData.shortUrl,
            urlCode:createData.urlCode
        }
        return res.
            status(201).
            send({ status: true, message: "Created Successfully", data:createselected })
    } catch (error) {
        res.
            status(500).
            send({ status: false, message: error.message })
    }

}

const urlRedirecting = async function (req, res) {
    try {
        let paramsUrlCode = req.params.urlCode
        let hitUrl1 = await GET_ASYNC(`${paramsUrlCode}`)
        
        

        if (hitUrl1) {
            return res.status(302).redirect(hitUrl1)
        }
        const requireData = await urlModel.findOne({ "urlCode": paramsUrlCode })
        if (requireData == null)
            return res.
                status(404).
                send({ status: false, message: `No URL found with this ${paramsUrlCode}` })
        const hitUrl = requireData.longUrl
        await SET_ASYNC(`${paramsUrlCode}`, hitUrl)
       
        return res.status(302).redirect(hitUrl)
    } catch (error) {
        res.
            status(500).
            send({ status: false, message: error.message })
    }
}


module.exports = { shortningUrl, urlRedirecting }