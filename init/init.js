const mongoose = require("mongoose");
const Apna = require("../models/apna");
const apnadata = require("./data");

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/apnaghar");
}

const listdata = async ()=>{
    await Apna.deleteMany();
    apnadata.sampleListings = apnadata.sampleListings.map((obj)=>({
        ...obj,
        owner: new mongoose.Types.ObjectId("69f49f16512d334befe3aae2")
    }))
    const adddata = await Apna.insertMany(apnadata.sampleListings);
    console.log(adddata.length);
}
main()
.then(async()=>{
    console.log("connection succesfull");
    await listdata();
})
.catch((err)=>{
   console.log(err);
})




