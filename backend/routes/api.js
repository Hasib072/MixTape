// routes/api.js
const express = require('express');
const fetch = require('node-fetch');
const { URL } = require('url');
const router = express.Router();

// Health Check endpoint
router.get('/', (req, res) => {
  res.send("MixTape Api Running...");
});

// getmp3
router.post('/getmp3', async (req, res) => {
    
    // Get the full request URL
  const fullUrl = req.originalUrl;

  // Find the position of the '?'
  const indexOfQuestionMark = fullUrl.indexOf('?');

  if (indexOfQuestionMark === -1) {
    return res.status(400).send('No URL provided.');
  }

  // Extract everything after the '?'
  const urlPart = fullUrl.substring(indexOfQuestionMark + 1);

    // Decode the URL in case it is URL-encoded
    const decodedUrl = decodeURIComponent(urlPart);

    // Parse the URL
    const parsedUrl = new URL(decodedUrl);

    let vidID;

    // First, try to get the 'v' query parameter
    vidID = parsedUrl.searchParams.get('v');

    if (vidID) {
        console.log(" from web: ",vidID);
        
        const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${vidID}`,
            {
                "method": "GET",
                "headers": {
                    'x-rapidapi-key': process.env.API_KEY,
                    'x-rapidapi-host': process.env.API_HOST
                  }
            }
        );

        const response = await fetchAPI.json();
    
        console.log(response.link);
        return res.send(response);

    }


    // If 'v' parameter doesn't exist, get the last segment of the pathname
    const pathname = parsedUrl.pathname; // e.g., '/_EOBQ9ofqPA'
    const segments = pathname.split('/').filter(Boolean); // Remove empty segments

    if (segments.length > 0) {
      // Get the last segment
      vidID = segments[segments.length - 1];

      
    }
    
    console.log(" from mobile: ",vidID);

    
    if (!vidID) {
        res.send("No Video ID")
    }else{

        const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${vidID}`,
            {
                "method": "GET",
                "headers": {
                    'x-rapidapi-key': process.env.API_KEY,
                    'x-rapidapi-host': process.env.API_HOST
                  }
            }
        );
    
        const response = await fetchAPI.json();
    
        console.log(response.link);
        return res.send(response);

    }
});

module.exports = router;
