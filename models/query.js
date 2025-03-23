const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    nameOfCryptoCoin: {
        type: String
    },
    typeOfQuery: {
        type: String
    },
});
const Query = mongoose.model('Query', querySchema);
module.exports = Query;