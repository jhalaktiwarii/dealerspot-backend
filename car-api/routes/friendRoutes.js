const express = require('express');
const { addFriend, getAllFriends, deleteFriend, getFriendsCars, searchUsers } = require('../controllers/friendController');
const extractCompanyName = require('../middleware/extractCompanyName');
const router = express.Router();

router.post('/', extractCompanyName, addFriend);
router.get('/', extractCompanyName, getAllFriends);
router.delete('/:friendId', extractCompanyName, deleteFriend);
router.get('/cars', extractCompanyName, getFriendsCars);
router.get('/search', extractCompanyName, searchUsers);

module.exports = router;
