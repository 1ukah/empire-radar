require('dotenv').config();
const io = require('socket.io-client');

const CONFIG = require('./config');
const { fetchMetadata } = require('./utils/empire.util');

const Speaker = require('speaker');
const ffmpeg = require('fluent-ffmpeg');
const Volume = require('pcm-volume');
const wav = require('wav');

const initializeSocket = async () => {
	try{
		console.log('[CSGOEmpire] Initializing socket...');

		const metadata = await fetchMetadata();

		const socket = io(CONFIG.WS_URL, {
			transports: ['websocket'],
			path: '/s/',
			secure: true,
			rejectUnauthorized: false,
			reconnect: true,
			extraHeaders: { 'User-Agent': `${metadata?.user?.id} API Bot` }
		});

		// Listen for the following event to be emitted by the socket in success cases
		socket.on('connect', () => console.log('[CSGOEmpire] Socket connected!'));
		socket.on('init', (data) => {
			if(data?.authenticated){
				console.log('[CSGOEmpire] Socket authenticated!');
				
				setTimeout(function() {
					console.clear()
				}, 250); 				  

				socket.emit('filters', {
					max_price: CONFIG.MAX_PRICE * 100,
					min_price: CONFIG.MIN_PRICE * 100
				});
			} else{
				console.log('[CSGOEmpire] Authenticating socket...');
				socket.emit('identify', {
					uid: metadata?.user?.id,
					model: metadata?.user,
					authorizationToken: metadata?.socket_token,
					signature: metadata?.socket_signature
				});
			}
		});
		
		socket.on('new_item', (data) => {
			var time = new Date().toLocaleTimeString();

			//console.log(data);

			//console.log(`[EMPIRE] ${data?.length} new items listed!`);
			Promise.all(data.map(async (item) => { //&& item?.auction_ends_at != 0 || null
				if (item?.custom_price_percentage <= -6 && item?.is_commodity == false && item?.item_search.category != 'Agent' && (item?.market_value / 100) >= 25 && (item?.market_value / 100 ) <= 550)
				{
					console.log(`\u001b[37m[${time}] \u001b[36m${item?.market_name} \u001b[37m- \u001b[33m[${await item?.wear}] \u001b[37m| \u001b[32m${item?.market_value / 100}⛃ (${item?.custom_price_percentage}%)`);

					const speaker = new Speaker({
						channels: 2,          // 2 channels
						bitDepth: 16,         // 16-bit samples
						sampleRate: 44100,    // 44,100 Hz sample rate
					});
		
					const wavDecoder = new wav.Reader();
					wavDecoder.pipe(speaker);

					const command = ffmpeg('beep.mp3').format('wav').pipe(wavDecoder);
		
					command.on('end', function() {
						speaker.end();
					});
				}
			}));
		});

		// Listen for the following event to be emitted by the socket in error cases
		socket.on('close', (reason) => console.log(`Socket closed: ${reason}`));
		socket.on('error', (data) => console.log(`WS Error: ${data}`));
		socket.on('connect_error', (data) => console.log(`Connect Error: ${data}`));
	} catch(err){
		console.error(`[CSGOEmpire] Error initializing socket: ${err.message}`);
	}
};

initializeSocket();