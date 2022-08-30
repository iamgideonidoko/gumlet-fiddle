const { argv } = require('process');
const { join } = require('path');
const { readdirSync} = require('fs');
const axios = require('axios');
const exec = require('child_process').exec;

/**
 * This script uploads multiple video files in a directory to a Gumlet video collection
 * 
 * @argument --path <path to directory where the videos reside>
 * @argument --format <format extension of file to upload>
 * @argument --collection <video collection id>
 * @argument --key <an API key to your gumlet account>
 */
(async () => {
  const pathIdx = argv.indexOf('--path');
  const formatIdx = argv.indexOf('--format');
  const collectionIdx = argv.indexOf('--collection');
  const keyIdx = argv.indexOf('--key');

  if (pathIdx === -1)
    return console.log('\x1b[31m%s\x1b[0m', 'Your must pass a path argument. Use --path <value>');
  if (formatIdx === -1)
    return console.log('\x1b[31m%s\x1b[0m', 'Your must pass a format argument. Use --format <value>');
  if (collectionIdx === -1)
    return console.log('\x1b[31m%s\x1b[0m', 'Your must pass a collection argument. Use --collection <value>');
  if (keyIdx === -1)
    return console.log('\x1b[31m%s\x1b[0m', 'Your must pass a key argument. Use --key <value>');

  const pathVal = argv[pathIdx + 1];
  const formatVal = argv[formatIdx + 1];
  const collectionVal = argv[collectionIdx + 1];
  const keyVal = argv[keyIdx + 1];

  /* type argument value not found */
  if (!pathVal)
    return console.log('\x1b[31m%s\x1b[0m', 'Path argument has no value. Use --path <value>');
  if (!formatVal)
    return console.log('\x1b[31m%s\x1b[0m', 'Format argument has no value. Use --format <value>');
  if (!collectionVal)
    return console.log('\x1b[31m%s\x1b[0m', 'Colection argument has no value. Use --collection <value>');
  if (!keyVal)
    return console.log('\x1b[31m%s\x1b[0m', 'Key argument has no value. Use --key <value>');

  const targetPath = join(__dirname, '/', pathVal);
  const supportedFormat = ['.mp4', '.mov', '.flv', '.mkv'];
  
  if (supportedFormat.indexOf(formatVal) === -1)
    return console.log('\x1b[31m%s\x1b[0m', `Format not supported. Only supports ${supportedFormat.join(', ').replace(/, ([^,]*)$/, ' and $1')}`);

  // Get an array of the files inside the folder
  const files = readdirSync(targetPath);

  // Loop through each file that was retrieved
  files.forEach((file) => {
    (async ()  => {
      if (file.slice(-4) === formatVal) {
        try {
          const createAssetBody = {
            source_id: collectionVal,
            format: 'hls',
            resolution: ['240p', '360p', '720p', '1080p'],
            keep_original: false,
          };
          console.log('\x1b[34m%s\x1b[0m', `Attempting to create asset for ${file}...`);
          const createAssetRes = await axios.post('https://api.gumlet.com/v1/video/assets/upload', createAssetBody, {
            headers: {
              Authorization: `Bearer ${keyVal}`,
            }
          });
          if (createAssetRes.status === 200) {
            console.log('\x1b[42m%s\x1b[0m', `Created asset for ${file}`);
            const uploadUrl = createAssetRes.data?.upload_url;
            if (uploadUrl) {
              console.log('\x1b[34m%s\x1b[0m', `Attempting to upload ${file}...`);
              exec(`curl -v -X PUT -T "${join(targetPath, '/', file)}" "${uploadUrl}"`, function (err) {
                if (err !== null) {
                  console.log('\x1b[31m%s\x1b[0m', `Could not upload ${file}`);
                }
                console.log('\x1b[42m%s\x1b[0m', `Uploaded ${file}`);
              });
            }
          } else {
            console.log('\x1b[31m%s\x1b[0m', `Could not create asset for ${file}`);
          }
        } catch (err) {
          if (err) console.log('\x1b[31m%s\x1b[0m', 'An error occured => ', err?.message);
        }
      }
    })();
  });
})();