const mongoose=require('mongoose')
const urlModel=require('../model/urlModel')
const shortid=require('shortid')
const validUrl=require('valid-url')

const shortningUrl=async function(req,res){
    
     if(Object.keys(req.body).length==0){
        return res.status(400).send({status:false,message:"Provide data in request body"})
     }
     let longUrl=req.body.longUrl
    if(!validUrl.isUri(longUrl)){
        return res.status(400).send({status:false,message:"Url is not valid"})
     }    
    const checkurl=await urlModel.findOne({"longUrl":longUrl})
    if(checkurl){
        return res.status(409).send({status:false,message:"Url is already present",data:checkurl})
    }
    const urlCode=(shortid.generate(longUrl)).toLowerCase()
    const shortUrl="localhost:3000/"+urlCode
    const createData=await urlModel.create({longUrl,shortUrl,urlCode})
    return   res.status(201).send({status:true,message:"Created Successfully" ,data:createData})
}

const urlRedirecting=async function(req,res){
    let paramsUrlCode=req.params.urlCode
    
    const requireData=await urlModel.findOne({"urlCode":paramsUrlCode})
    if(requireData==null){
        return res.status(404).send({status:false,message:"No URL found with this urlCode"})
    }
    const hitUrl=requireData.longUrl
   return res.redirect(hitUrl)
}


module.exports={shortningUrl,urlRedirecting}