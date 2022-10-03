const express=require('express')
const router=express.Router()
const urlController=require('../controller/urlController')


router.post('/url/shorten',urlController.shortningUrl)
router.get('/:urlCode',urlController.urlRedirecting)


router.all('/*',async function(req,res){
    return res.status(400).send({status:false,Message:"Check url"})
})









module.exports=router