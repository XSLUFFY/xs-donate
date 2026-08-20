const r=require('express').Router();
r.get('/',(req,res)=>res.json({target:0,current:0}));
module.exports=r;
