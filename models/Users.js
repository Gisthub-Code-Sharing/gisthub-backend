const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    userName: {type: String, required: true},
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    gists: [{type: Schema.Types.ObjectId, ref: 'Gist'}]
});

var User = mongoose.model('User', userSchema);

module.exports = {
    User,
}
