const env = process.env.NODE_ENV || 'production'

//insert your API Key & Secret for each environment, keep this file local and never push it to a public repo for security purposes.
const config = {
	development :{
		APIKey : '4yaP1M0LTPCCCl0uzBe0ag',
		APISecret : '2dNWrmzewuDZrsm1j1YSovEiMgERDLRcC78L'
	},
	production:{	
		APIKey : '4yaP1M0LTPCCCl0uzBe0ag',
		APISecret : '2dNWrmzewuDZrsm1j1YSovEiMgERDLRcC78L'
	}
};

module.exports = config[env]
