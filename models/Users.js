const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var userSchema = new Schema({
    userName: {type: String, required: false},
    email: {type: String, required: true},
    password: {type: String, required: true},
    gists: {type: Schema.Types.ObjectId, ref: 'Gist'}
});

var User = mongoose.model('User', userSchema);

module.exports = {
    User,
}
