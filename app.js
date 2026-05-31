require("dotenv").config();
process.noDeprecation = true;

const express = require("express");
const app = express();
const port = 8080;
const path = require("path");
const mongoose = require("mongoose");
const Apna = require("./models/apna");
const methodOverride = require('method-override')
const engine = require("ejs-mate");
const Review = require("./models/review");
const session = require("express-session");
const passport =  require("passport");
const LocalStrategy = require('passport-local').Strategy;
const passportLocalMongoose = require("passport-local-mongoose");
const flash = require('connect-flash');
const User = require("./models/user");
const {islogged,isOwner} = require("./middleware");
const multer = require("multer");
const {storage} = require("./cloudconfig");
const upload = multer({ storage });
const { createServer } = require("node:http");
const server = createServer(app);
const { join } = require('node:path');
const { Server } = require('socket.io');
const io = new Server(server);

app.set("views",path.join(__dirname,"/views"));
app.use(express.static(path.join(__dirname,"public")));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.engine("ejs" , engine);
app.use(session({
    secret: "mysecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now()+7*24*60*60*1000),
        maxAge: 7*24*60*60*1000,
        httpOnly: true
    }
}))
app.use(flash());
passport.use(
  new LocalStrategy(
    { usernameField: "email" }, 
    User.authenticate()
  )
);
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    next();
})

async function main(){
        await mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/apnaghar");
}
main()
.then(()=>{
    console.log("connection succesfull");
})
.catch((err)=>{
   console.log(err);
})
io.on("connection", (socket) => {
    console.log("a user connected");
   socket.on("joinRoom",(ownerId)=>{
    socket.join(ownerId);
    console.log(`user joined in ${ownerId}`);
   })
    socket.on("sendMessage", (data) => {
        // data = { sender, receiver, message }
        io.to(data.ownerId).emit("receiveMessage",data); // broadcast to all
    });

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });
});
server.listen(port,(req,res)=>{
    console.log("app is listening");
})
app.get("/",(req,res)=>{
    res.redirect("/apnaghar")
})
app.get("/apnaghar",async (req,res)=>{
    let {catagory,name} = req.query;
    let seeapna = [];
    if(name){
        seeapna = await Apna.find({
            name: {$regex: name.trim() , $options: "i"}
        });
    }
    else if(catagory){
        seeapna = await Apna.find({catagory});
    }else{
     seeapna = await Apna.find();
    }
        seeapna.forEach(a => console.log(a.name, "| image:", a.image));

   res.render("show.ejs",{seeapna});
})
app.get("/apnaghar/new",islogged,(req,res)=>{
    res.render("new.ejs");
})
app.post("/apnaghar",islogged,upload.single("apna[image]"),async(req,res)=>{
    let addapna = req.body.apna;
    const newuser = new Apna(addapna);
        console.log("req.file:", req.file); // ✅ add thi
    let url = req.file.path;
    let filename= req.file.filename;
    newuser.image = {url,filename};
    newuser.owner = req.user._id;
    const saveuser = await newuser.save();
    console.log(saveuser);
    console.log(saveuser.catagory);
    res.redirect("/apnaghar");
})
app.get("/apnaghar/:id/edit",islogged,isOwner,async(req,res)=>{
  let {id} = req.params;
  let apna = await Apna.findById(id);
  res.render("edit.ejs",{apna});
})
app.put("/apnaghar/:id",islogged,isOwner,async(req,res)=>{
    let {id} = req.params;
    let updateapna = await Apna.findByIdAndUpdate(id,req.body.apna);
    console.log(updateapna);
    res.redirect("/apnaghar");
})
app.get("/apnaghar/:id/detail",async(req,res)=>{
    let {id} = req.params;
    let showapna = await Apna.findById(id).populate({path: "reviews",populate: {path: "author"}},).populate("owner");
    res.render("detail.ejs",{showapna, mapapi: process.env.TOMTOM_API_KEY});
})
app.delete("/apnaghar/:id",islogged,isOwner,async(req,res)=>{
    let {id} = req.params;
    let deleteghar = await Apna.findByIdAndDelete(id);
    console.log(deleteghar);
    res.redirect("/apnaghar")
})
app.post("/apnaghar/:id/review",islogged,async(req,res)=>{
    let {id} = req.params;
    let findid = await Apna.findById(id);
    let newreview = new Review(req.body.review);
    newreview.author = req.user._id;
    findid.reviews.push(newreview._id);
    await findid.save();
    await newreview.save();
    res.redirect(`/apnaghar/${id}/detail`);
})
app.get("/apnaghar/signup",(req,res)=>{
    res.render("signup.ejs")
})
app.post("/apnaghar/signup",async(req,res,next)=>{
    try{
    let {username,email,password}= req.body;
    let newuser = new User({email,username});
    let registeruser = await User.register(newuser,password);
    req.logIn(registeruser,(err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","Succesfully signed up");
        console.log(registeruser);
        res.redirect("/apnaghar");
    })
}catch(err){
     req.flash("error", err.message);
     res.redirect("/apnaghar/signup");
}
})
app.get("/apnaghar/messages/:ownerId",islogged,(req,res)=>{
    let {ownerId} = req.params;
   res.render("messages.ejs",{ownerId});
});
app.get("/apnaghar/inbox",islogged,(req,res)=>{
    let ownerId = req.user._id;
    res.render("inbox.ejs",{ownerId});
})
app.get("/apnaghar/login",(req,res)=>{
    res.render("login.ejs");
})
app.post('/apnaghar/login', 
  passport.authenticate('local', { 
    failureRedirect: '/apnaghar/login',
    failureFlash: true 
}),
  (req, res)=>{
    req.flash("success","Welcome back to apnaghar");
    console.log(req.body);
    res.redirect('/apnaghar');
  });
app.get("/apnaghar/logout",(req,res,next)=>{
    req.logOut((err)=>{
        if(err){
            next(err);
        }
        req.flash("error","User logged out");
        res.redirect("/apnaghar");
    })
})
