export default thisfunction=>(req,res,next)=>{
    Promise.resolve(thisfunction(req,res,next)).catch(next);
}