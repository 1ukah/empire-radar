const axios = require('axios');
const { HTTP_URL } = require('../config');

axios.defaults.headers.common['Authorization'] = `Bearer ${process.env.CSGOEMPIRE_TOKEN}`;

const fetchMetadata = async () => {
	try{
		const response = await axios.get(`${HTTP_URL}/metadata/socket`)

		return response.data;
	} catch(error){
		console.error(`[CSGOEmpire] Error fetching metadata: ${error?.response?.data?.message || error.message}`);
	}
};

module.exports = {
	fetchMetadata
};