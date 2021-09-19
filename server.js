const Koa = require('koa');
const Router = require('koa-router');
const koaLogger = require('koa-logger');
const cors = require('@koa/cors');
const bodyParser = require('koa-bodyparser');
const session = require('koa-session');
const mongo = require('mongoose');
const forOwn = require('lodash/forOwn');
const mount = require('koa-mount');
const serve = require('koa-static');
const _ = require('lodash');

mongo.connect("mongodb+srv://admin:0zKQA8TYBKGYR6KE@gisthub.whalg.mongodb.net/gisthub?retryWrites=true&w=majority", {useNewUrlParser: true, useUnifiedTopology: true });

const {User} = require('./models/Users');
const {Gist} = require('./models/Gists');
const app = new Koa();

app.proxy = true

app.keys = ['SECRET_KEY']

const CONFIG = {
    key: 'koa.sess', /** (string) cookie key (default is koa.sess) */
    /** (number || 'session') maxAge in ms (default is 1 days) */
    /** 'session' will result in a cookie that expires when session/browser is closed */
    /** Warning: If a session cookie is stolen, this cookie will never expire */
    maxAge: 86400000,
    autoCommit: true, /** (boolean) automatically commit headers (default true) */
    overwrite: true, /** (boolean) can overwrite or not (default true) */
    httpOnly: false, /** (boolean) httpOnly or not (default true)        TODO:CHANGE TO TRUE AFTER DEVELEOPMENT*/
    signed: true, /** (boolean) signed or not (default true) */
    rolling: false, /** (boolean) Force a session identifier cookie to be set on every response. The expiration is reset to the original maxAge, resetting the expiration countdown. (default is false) */
    renew: true, /** (boolean) renew session when session is nearly expired, so we can always keep user logged in. (default is false)*/
    secure: false, /** (boolean) secure cookie        TODO:CHANGE TO TRUE AFTER DEVELOPMENT*/
    sameSite: null, /** (string) session cookie sameSite options (default null, don't set it) */
};

app.use(session(CONFIG, app));
app.use(koaLogger());

app.use(async (ctx, next) => {
    try{
        await next();
    } catch(error){
        ctx.status = error.status || 500;
        ctx.type = 'json';
        ctx.body = {
            message: error.message,
            type: error.type,
        };
        ctx.app.emit('error', error, ctx);
    }
});

const corsOptions = {
    credentials: true,
}
app.use(cors(corsOptions));
app.use(bodyParser());

const passport = require('koa-passport');

app.use(passport.initialize());
app.use(passport.session());

const auth = require('./controllers/auth');

const router = new Router();

router
    .get('/test', ctx => {
        ctx.status = 200;
        ctx.body = "HI";
    })
    .post('/login', ctx => passport.authenticate('local', (err, user) => {
        if(!user){
            ctx.throw(401, err);
        } else {
            ctx.body = user;
            return ctx.login(user);
        }
    })(ctx))
    .post('/register', ctx => passport.authenticate('local.signup', (err, user) => {
        if(!user){
            ctx.throw(401, err);
        } else {
            ctx.body = user;
            return ctx.login(user);
        }
    })(ctx))
    .post('/myGists', async ctx => {
        const {user} = ctx.request.body
        if(user) {
            const newUser = await User.findById(user.id).populate('gists');
            ctx.body = {
                gists: newUser.gists,
            }
        }
        else{
            ctx.throw(401, "You are not authenticated");
        }
    })
    .post('/createGist', async ctx => {
        const {user} = ctx.request.body
        if(user) {
            let newGist = new Gist({owner: user.id}); //TODO: Once model is finished
            await newGist.save();
            User.findByIdAndUpdate(user.id, {$push: {gists: newGist.id}})
            ctx.body = {
                message: "Created successfully",
                id: newGist._id,
            }
        }
        else {
            ctx.throw(401, "You are not authenticated");
        }
    })
    .post('/updateGist', async ctx => {
        const {user} = ctx.request.body
        if(user) {
            const {gistId} = ctx.request.body;

            const gist = Gist.findById(gistId)
            if(gist.owner !== user._id){
                ctx.throw(403, "You do not own this gist")
            }
            delete ctx.request.body['gistId'];
            await Gist.updateOne({_id: gistId}, {$set: ctx.request.body});

            ctx.body = {
                message: "Successfully updated"
            }
        }
        else {
            ctx.throw(401, "You are not logged in")
        }
    })
    .post('/viewGist', async ctx => {
        const {gistId, user} = ctx.request.body;
        const gist = await Gist.findById(gistId)
        if (!gist) {
            ctx.throw(404, "Gist not found")
        }
        if(!gist.isPrivate) {
            ctx.body = {
                gist
            }
            return
        } else {
            if(user) {
                console.log(user.id, " :: ", gist.owner._id, " ::  ", user.userName, ' :: ', gist.permissions);
                if (user.id === gist.owner._id || user.userName in gist.permissions){
                    console.log("PERMISSION GRANTED")
                    ctx.body = {
                        gist
                    }
                    return
                } else {
                    ctx.throw(403, "You do not have permission to view this");
                }
        }
        ctx.throw(401, "You are not authenticated");
    }})
    .post('/getAllUsers', async ctx => {
        const users = await User.find({});
        ctx.body = { users: users.map(usr => ({firstName: usr.firstName, lastName: usr.lastName, email: usr.email, userName: usr.userName}))}
    })

    app.use(router.routes()).use(router.allowedMethods());


    app.listen(process.env.PORT || 1338, () => {
        console.log('Application is starting on port 1338')
    })
