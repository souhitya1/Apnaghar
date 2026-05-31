const Apna = require("./models/apna");
module.exports.islogged = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","Login first");
        return res.redirect(`/apnaghar`);
    }
    next();
}
module.exports.isOwner = async(req,res,next)=>{
    let {id} = req.params;
    let getapna = await Apna.findById(id);
    if(!getapna.owner.equals(req.user._id)){
        req.flash("error","You are not the owner of this ghar");
        return res.redirect(`/apnaghar/${id}/detail`);
    }
    next();
}