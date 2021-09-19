const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var gistSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    title: String, 
    description: String,
    permissions: [{type: Schema.Types.ObjectId, ref: 'User'}],
    content: [ new Schema({type: String, payload: String})],
    isPrivate: Boolean,
});

var Gist = mongoose.model('Gist', gistSchema);

module.exports = {
    Gist,
}
