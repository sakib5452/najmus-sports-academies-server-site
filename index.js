const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hxno4y0.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const usersCollection = client.db('sportAcademies').collection('user')
        const classesCollection = client.db('sportAcademies').collection('classes')


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })

        // Warning: use verifyJWT before using verifyAdmin
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }



        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })


        // Save user email and role in DB
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email
            const user = req.body
            const query = { email: email }
            const options = { upsert: true }
            const updateDoc = {
                $set: user,
            }
            const result = await usersCollection.updateOne(query, updateDoc, options)
            console.log(result)
            res.send(result)
        })

        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        })
        // app.get('/users/:email', async (req, res) => {
        //     const email = req.params.email
        //     const query = { email: email }
        //     const result = await usersCollection.findOne(query)
        //     console.log(result)
        //     res.send(result)
        // })

        // Save a classes in database
        app.post('/classes', async (req, res) => {
            const classes = req.body
            console.log(classes)
            const result = await classesCollection.insertOne(classes)
            res.send(result)
        })


        // Get all classes
        app.get('/classes', async (req, res) => {
            const result = await classesCollection.find().toArray()
            res.send(result)
        })

        app.get("/classes/:email", async (req, res) => {
            console.log(req.params.email);
            const classes = await classesCollection
                .find({
                    email: req.params.email,
                })
                .toArray();
            res.send(classes);
        });


        // Get a single room
        app.get('/class/:email', async (req, res) => {
            const email = req.params.email
            const query = { 'email': email }
            const result = await classesCollection.find(query).toArray()

            console.log(result)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







app.get('/', (req, res) => {
    res.send('sport is running')
})

app.listen(port, () => {
    console.log(`sport is running on port ${port}`)
})