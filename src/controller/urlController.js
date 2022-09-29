const mongoose = require('mongoose')
const urlModel = require('../model/urlModel')
const shortid = require('shortid')
const validUrl = require('valid-url')

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
        
        const checkurl = await urlModel.findOne({ "longUrl": longUrl })
        if (checkurl)
            return res.
                status(409).
                send({ status: false, message: "Url is already present", data: checkurl })

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
        const requireData = await urlModel.findOne({ "urlCode": paramsUrlCode })
        if (requireData == null)
            return res.
                status(404).
                send({ status: false, message: "No URL found with this urlCode" })
        const hitUrl = requireData.longUrl
        return res.status(203).redirect(hitUrl)
    } catch (error) {
        res.
            status(500).
            send({ status: false, message: error.message })
    }
}


module.exports = { shortningUrl, urlRedirecting }