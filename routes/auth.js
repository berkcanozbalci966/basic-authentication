const router = require("express").Router();
const User = require("../model/User");
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { registerValitation, loginValidation } = require('../validation')

// VALIDATION
router.post("/register", async (req, res) => {


    // LETS VALIDATE THE DATA BEFORE WE A USER

    const { error } = registerValitation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    const emailExist = await User.findOne({ email: req.body.email })

    if (emailExist) return res.status(400).send("email already exists")

    // HASH passwords
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(req.body.password, salt)


    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashPassword,
    });
    try {
        const savedUser = await user.save();
        res.send({ user: user._id });
    } catch (err) {
        res.status(400).send(err);
    }
});

// Login

router.post('/login', async (req, res) => {

    // Lets validate the data before we a user
    const { error } = loginValidation(req.body)
    if (error) return res.status(400).send(error.details[0].message)

    // checking if the email exists
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).send("Email is not found")

    //Password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password)
    if (!validPass) return res.status(400).send("Invalid password")


    // Create and assign a token

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
    res.header('auth-token', token).send(token)

})

module.exports = router;
