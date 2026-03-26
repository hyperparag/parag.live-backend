const router = require('express').Router();


const { addMedia , getMedias , searchMedia , getMedia , deleteMedia , updateMedia, getSearch} = require('../countries/controller');
const { getMediasService, addCountryService , getSearchService } = require('../countries/service');


router.post('/' ,  addCountryService)

router.patch( '/:id' , updateMedia );

router.get('/' ,  getMediasService)

router.delete('/:id' ,  deleteMedia)

router.get('/search' ,    getSearchService)

router.get('/:id',  getMedia)

module.exports = router;