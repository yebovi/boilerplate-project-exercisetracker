const express = require('express')
const app = express()
const mongo = require('mongodb');
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true},function(err,db){if(err){console.log(err)}else{console.log('connected to ' + process.env.MONGO_URI)}} || 'mongodb://localhost/exercise-track' )

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))

const userSchema = new mongoose.Schema({userName:String})
const User=mongoose.model('User', userSchema)

const exerciseSchema = new mongoose.Schema({userId:{type:String, required:true},description:{type:String, required:true}, duration:{type:Number,required:true},date:{type:Date,default:Date.now}})
const Exercise = mongoose.model('Exercise',exerciseSchema)

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use("/api/exercise/new-user",function(req,res,next){
  let username= req.body.username;
  //findOne cause find doesnt return a null when nothing is found
  User.findOne({userName:username},(err,user)=>{
    if (err) return;
    if (user){
     res.send("Username Already Taken")
    }
   else{
    let newUser = new User({ userName:username});  
    newUser.save((err,newUser)=>{ if(err) {throw err} res.send({"username":newUser.userName,"_id":newUser._id})
                         })
   } 
  })
 })

app.get("/api/exercise/users",(req,res)=>{
  User.find({},(err,user)=>{
   res.send(user)
     }) 
  })

app.use("/api/exercise/add",(req,res,next)=>{
   let desc =  req.body.description;
  if(desc==""){
    res.send("Description is required")
  }
  else{
    next()
  }
})

app.use("/api/exercise/add",(req,res,next)=>{
   let dur =  req.body.duration;
  if(dur==""){
    res.send("Duration is required")
  }
  else{
    next()
  }
})

app.use("/api/exercise/add",(req,res,next)=>{
  let userId = req.body.userId;
  let desc = req.body.description;
   let dur =  req.body.duration;
  let dat =  req.body.date;
  //if id matches the id format, must be there if not will throw an error if input id doesnt match id format
  if (userId.match(/^[0-9a-fA-F]{24}$/)) {
  User.findById(userId,(err,user)=>
        {
     if(err){throw err}
    //returns null if id isnt found
    if(user==null){res.send('Invalid User_ID')}
  // create doc of Exercise model
    let newExercise = new Exercise({
        userId:userId,
        description: desc,
        duration: dur
      });
    //if there is a date input, update newExercise date to the new date
     if (dat.length > 0) {
        newExercise.date = new Date(dat);
      }

    newExercise.save((err,newExercise)=>{if (err){throw err} else{res.send({username:user.userName,description:desc,duration:dur,_id:userId,date:newExercise.date} )} })
    
     }
 )
   }else res.send('Invalid User_ID')
})

app.get("/api/exercise/log",(req,res)=>{
  let userId=req.query.userId
  let from=req.query.from
  let to=req.query.to
  let limit=req.query.limit
   if (userId.match(/^[0-9a-fA-F]{24}$/)) {
     //findbyId shouldreturn only only username and by default _id
 User.findById(userId,'userName',(err,user)=>
        {
    if(err) throw err;
   //if from has no input it should be 0, which when parsed to new Date returns a date since 1970
   if(from===undefined){
     from= new Date(0)
   }
   //if to has no input it should be parsed to new Date which returns current date 
   if(to===undefined){
     to= new Date()
   }
   //if limit is undefined it defauls to a limit of 0 else it is parsed to an integer
   if(limit===undefined){
     limit=0;
   }else{limit= parseInt(limit)}
  //query searches exercise model using the input userId and searches between the dates from & to, excludes the id, userId and and __v in the result
   //sorts the result i.e description, date and duration objects  in descending order and limits it to the required limit.
   let query= Exercise.find({userId:userId,date:{$gte:from,$lte:to}},'-_id -userId -__v',(err)=>{
     if(err) throw err;
   }).sort({date:-1}).limit(limit)
   query.exec((err,log)=>{
     if (err) throw err;
    res.send({_id:userId,username:user.userName,from:from,to:to,log:log}) 
   })
     })
  }else res.send('Invalid User_ID')
  
})
// Not found middleware
// Error Handling middleware



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
