const mongoose = require('mongoose')
const urlModel = require('../model/urlModel')
const shortid = require('shortid')
const validUrl = require('valid-url')
const redis = require("redis")
const { promisify } = require('util')



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
                send({ status: false, message: "invalid entry inside request body" })

        // ********************* Validation of Url *******************************

        if (!validUrl.isUri(longUrl))
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


        const checkurl = await urlModel.findOne({ "longUrl": longUrl })

        if (checkurl) {
            await SET_ASYNC(`${longUrl}`, JSON.stringify(checkurl))
            return res.
                status(200).
                send({ status: true, message: "Url is already present", data: checkurl })
        }


        const urlCode = (shortid.generate(longUrl)).toLowerCase()
        const shortUrl = "localhost:3000/" + urlCode
        const createData = await urlModel.create({ longUrl, shortUrl, urlCode })
        return res.
            status(201).
            send({ status: true, message: "Created Successfully", data: createData })
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
                send({ status: false, message: `No URL found with this ${urlCode}` })
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