const mongoose = require('mongoose');

const querySchema = new mongoose.Schema({
    nameOfCryptoCoin: {
        type: String
    },
    analysisOfCoin: {
        type: String
    },
    scamLikelihood: {
        type: Number
    },
    typeOfQuery: {
        type: String
    },
});
const Query = mongoose.model('Query', querySchema);
module.exports = Query;