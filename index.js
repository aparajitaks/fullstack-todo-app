const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('./generated/prisma');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(express.static('frontend'));

app.get('/todos', async (req, res) => {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(todos);
  } catch (error) {
    console.log("Error fetching todos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.post('/todos',async(req,res)=>{
  try{
    const {title}=req.body
    if (!title){
      return res.status(400).json({error:'Title is required.'})
    }
    const newTodo = await prisma.todo.create({
      data:{
        title,
      }
    })
    res.status(201).json(newTodo);
  }catch(error){
    console.log('Error creating todo:',error)
    res.status(500).json({error:'Could not create todo.'})
  }
})

app.put('/todos/:id',async(req,res)=>{
  try{
    const {id}=req.params
    const {completed}=req.body
    const updatedTodo=await prisma.todo.update({
      where:{
        id:parseInt(id)
      },
      data:{
        completed:completed
      }
    })
    res.json(updatedTodo)
  }catch(error){
    console.log('Error updating todo:',error)
    res.status(500).json({error:'Could not update todo.'})
  }
})

app.delete('/todos/:id',async(req,res)=>{
  try{
    const {id}=req.params
    await prisma.todo.delete({
      where:{
        id:parseInt(id)
      }
    })
    res.status(204).send()
  }catch(error){
    console.log('Error deleting todo:',error)
    res.status(500).json({error:'Could not delete todo.'})
  }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
