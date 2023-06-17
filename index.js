const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
// const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
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
        const selectedCollection = client.db('sportAcademies').collection('selected')



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

        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ instructor: false })
            }

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instructor: user?.role === 'instructor' }
            res.send(result);
        })


        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };

            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);

        })
        // classes Approved
        app.get('/classes/approved/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ approved: false })
            }

            const query = { email: email }
            const user = await classesCollection.findOne(query);
            const result = { approved: user?.status === 'Approved' }
            res.send(result);
        })


        app.patch('/classes/approved/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: 'Approved'
                },
            };

            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);

        })
        // classes Deny
        app.get('/classes/deny/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ deny: false })
            }

            const query = { email: email }
            const user = await classesCollection.findOne(query);
            const result = { deny: user?.status === 'Deny' }
            res.send(result);
        })


        app.patch('/classes/deny/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    status: 'Deny'
                },
            };

            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);

        })

        // Save a classes in database
        app.post('/classes', async (req, res) => {
            const classes = req.body
            console.log(classes)
            const result = await classesCollection.insertOne(classes)
            res.send(result)
        })


        // app.put('/classes/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const filter = { _id: new ObjectId(id) };
        //     const updatedClasses = req.body;
        //     console.log(updatedClasses);
        //     const updateDoc = {
        //         $set: {
        //             status: updatedClasses.status,
        //             name: updatedClasses.name,
        //             price: updatedClasses.price,
        //             seats: updatedClasses.seats
        //         },
        //     };
        //     const result = await classesCollection.updateOne(filter, updateDoc, { new: true });
        //     res.send(result);
        // })


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

        // Approved classes
        app.get("/approved", async (req, res) => {
            // console.log(req.params.email);
            const approved = await classesCollection
                .find({
                    status: 'Approved',
                })
                .toArray();
            res.send(approved);
        });


        // classes selected
        app.get('/classes/selected/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if (req.decoded.email !== email) {
                res.send({ selected: false })
            }

            const query = { email: email }
            const user = await classesCollection.findOne(query);
            const result = { selected: user?.selected === 'selected' }
            res.send(result);
        })


        app.patch('/classes/selected/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    selected: 'Success'
                },
            };

            const result = await classesCollection.updateOne(filter, updateDoc);
            res.send(result);

        })


        app.get("/selected", async (req, res) => {
            // console.log(req.params.email);
            const approved = await classesCollection
                .find({
                    selected: 'Success',
                })
                .toArray();
            res.send(approved);
        });

        app.post('/addClass', async (req, res) => {
            const addClass = req.body;
            console.log(addClass)
            const result = await selectedCollection.insertOne(addClass);
            res.send(result)
        })

        app.get('/addClass', async (req, res) => {
            const result = await selectedCollection.find().toArray()
            res.send(result)
        })


        app.get("/addClass/:email", async (req, res) => {
            console.log(req.params.email);
            const selected = await selectedCollection
                .find({
                    email: req.params.email,
                })
                .toArray();
            res.send(selected);
        });

        // instructor

        app.get("/instructors", async (req, res) => {
            // console.log(req.params.email);
            const instructor = await usersCollection
                .find({
                    role: 'instructor',
                })
                .toArray();
            res.send(instructor);
        });


        app.get('/class/:email', async (req, res) => {
            const email = req.params.email
            const query = { 'email': email }
            const result = await classesCollection.find(query).toArra()

            console.log(result)
            res.send(result)
        })


        // create payment intent
        // app.post("/create-payment-intent", async (req, res) => {
        //     const { price } = req.body;

        //     // Create a PaymentIntent with the order amount and currency
        //     const amount = price * 100;
        //     console.log('amount', amount);
        //     const paymentIntent = await stripe.paymentIntents.create({
        //         amount: amount,
        //         currency: "usd",
        //         payment_method_types: ['card']
        //     });

        //     res.send({
        //         clientSecret: paymentIntent.client_secret,
        //     });
        // });





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