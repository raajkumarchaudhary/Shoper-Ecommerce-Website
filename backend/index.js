const port = 4000;
// Initializing all the dependencies
const express = require("express"); //initializing package named express
const app = express();
const mongoose = require("mongoose"); //initializing package named mongoose
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path"); //Using this path we can get out backend directory in our express path
const cors = require("cors");
const { deflateSync } = require("zlib");
const { log } = require("console");

app.use(express.json()); //With the help of this express.json whatever request that will be automatiicaly passed to json
app.use(cors()); //Using this our react project will connect to express app in 4000 port

//Initializing our database, we'll be using mongo db atlas database
//Database connection with mongodb     
mongoose.connect("mongodb+srv://rohitbahadurbista:<password>@cluster0.0rse1zl.mongodb.net/anecommercewebsite")
//Now Mongo db is connected with our express server

// API Creation

app.get("/",(req,res)=>{
    res.send("Express App is Running")
})

// Image Storage Engine

const storage = multer.diskStorage({
    destination: './upload/images',
    filename:(req,file,cb)=>{
        return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})

const upload = multer({storage:storage})

//Creating upload Endpoint for images
app.use('/images',express.static('upload/images'))

app.post("/upload",upload.single('product'),(req,res)=>{
    res.json({
        success:1,
        image_url:`http://localhost:${port}/images/${req.file.filename}`
    })
})

// Schema for creating products

const Product = mongoose.model("Product",{
    id:{
        type: Number,
        required: true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type: Number,
        required: true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    avilable:{ 
        type:Boolean,
        default:true,
    },
})

app.post('/addproduct',async (req,res)=>{
    let products = await Product.find({}); //We'll get all the products that we have added in the db in that array
    let id;
    if(products.length>0){
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id+1;
    }else{
        id = 1;
    }
    const product = new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

//Creating API for deleting products

app.post('/removeproduct',async (req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

// Creating API for getting all products
app.get('/allproducts',async (req,res)=>{
    let products = await Product.find({});
    console.log("All products fetched");
    res.send(products);
})

// Shema crating for User model

const Users = mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

// Creating Endpoint for registering user
app.post('/signup',async (req,res)=>{

    // To check if the emailID and password already exist or not
    let check = await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email"}) //If user already has account then we will respond success as false and error message
    }

    //If the user is not in the database then
    let cart = {};
    for (let i=0;i < 300;i++){
        cart[i] = 0;
    }
    const user = new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })

    await user.save();

    const data = { //Data object creation
        user:{   // Storing an object in the key
            id:user.id
        } 
    }

    const token =jwt.sign(data,'secret_ecom'); //For data encryption using salt
    res.json({success:true,token}) //sending one object in this response
})

// Creating end point for user login
app.post('/login',async (req,res)=>{
    let user = await Users.findOne({email:req.body.email});
    if(user){ //If we get any user so fist we will compare the password of the user
        const passCompare = req.body.password === user.password; // If both are same then we can go further
        if(passCompare){ // If true this will create this user object
            const data = {
                user:{
                    id:user.id
                }
            }
            const token = jwt.sign(data,'secret_ecom');
            res.json({success:true,token}) // Creating one response
        }else{ // If password is wrong
            res.json({success:false,errors:"Wrong Password"});
        }
    }else{  // If user id not matching
        res.json({success:false,errors:"Wrong Email Id"});
    }
})

// Creating endpoint for new collection data
app.get('/newcollections',async (req,res)=>{
    let products = await Product.find({});
    let newcollection = products.slice(1).slice(-8); //Recently added new products
    console.log("NewCollection Fetched");
    res.send(newcollection);
})

// Creating End point for popular in women

app.get('/popularinwomen',async (req,res)=>{
    let products = await Product.find({category:"women"});
    let popular_in_women = products.slice(0,4);
    console.log("Popular in women fetched");
    res.send(popular_in_women);
})

//Creating middleware to fetch user
    const fetchUser = async (req,res,next)=>{
        const token = req.header('auth-token');
        if(!token){ //Token not available
            res.status(401).send({errors:"Please authenticate using valid token"});
        }else{
            try{
                const data = jwt.verify(token,'secret_ecom');
                req.user = data.user;
                next();
            }catch(error){
                res.status(401).send({errors:"Please authenticate using a valid token"});
            }
        }
    }

//Creating end points for adding products in cartdata
app.post('/addtocart',fetchUser,async (req,res)=>{
    console.log("added",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId] += 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Added");
})

//Creating endpoint to remove product from cartdata
app.post('/removefromcart',fetchUser,async (req,res)=>{
    console.log("removed",req.body.itemId);
    let userData = await Users.findOne({_id:req.user.id});
    if(userData.cartData[req.body.itemId]>0)
    userData.cartData[req.body.itemId] -= 1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send("Removed");
})

//Creating end point to get cart data
app.post('/getcart',fetchUser,async (req,res)=>{
    console.log("GetCart");
    let userData = await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

app.listen(port,(error)=>{
    if(!error){
        console.log("Server running on Port "+port)
    }else{
        console.log("Error : "+error)
    }
})
