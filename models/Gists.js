const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var gistSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    title: String, 
    description: String,
    permissions: [{type: String}],
    content: [ new Schema({type: String, payload: String})],
    isPrivate: {type: Boolean, default: true},
});

var Gist = mongoose.model('Gist', gistSchema);

module.exports = {
    Gist,
}
