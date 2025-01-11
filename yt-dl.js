const axios = require('axios');

class SaveTube {
    constructor() {
      this.qualities = { 
         audio: { 1: '32', 2: '64',3: '128', 4: '192' },
         video: { 1: '144', 2: '240', 3: '360', 4: '480', 5: '720', 6: '1080', 7: '1440', 8: '2160' }
      };
      this.headers = {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'Referer': 'https://ytshorts.savetube.me/',
        'Origin': 'https://ytshorts.savetube.me/',
        'User-Agent': 'Postify/1.0.0'
      };
    }

    getRandomCdn() {
        return Math.floor(Math.random() * 11) + 51 
    }

    validateQuality(type, qualityIndex) {
      if (!this.qualities[type]?.[qualityIndex]) {
        throw new Error(`❌ Qualidade ${type} inválida. Escolha entre: ${Object.keys(this.qualities[type]).join(', ')}`);
      }
    }

    fetchData(url, cdn, body = {}) {
      return new Promise((resolve, reject) => {
        axios.post(url, body, {
           headers: {
             ...this.headers,
             authority: `cdn${cdn}.savetube.su`
           }
        }).then((response) => { 
           return resolve(response.data)
        }).catch((error) => {
           return reject(error);
        });
      });
    }

    generateDownloadLink(cdnUrl, type, quality, videoKey) {
        return `https://${cdnUrl}/download`;
    }

    download(link, qualityIndex, type) {
      return new Promise((resolve, reject) => {
        if (!['audio', 'video'].includes(type)) {
            return reject(new Error('❌ Tipo inválido. Escolha "audio" ou "video".'));
        }
        try {
          this.validateQuality(type, qualityIndex);
        } catch (error) {
          return reject(error);
        }
        
        const quality = this.qualities[type][qualityIndex];
        const cdnNumber = this.getRandomCdn();
        const cdnUrl = `cdn${cdnNumber}.savetube.su`;
        
        this.fetchData(`https://${cdnUrl}/info`, cdnNumber, {
            url: link 
        }).then((videoInfo) => {
           return this.fetchData(this.generateDownloadLink(cdnUrl, type, quality, videoInfo.data.key), cdnNumber, {
             downloadType: type, 
             quality: quality, 
             key: videoInfo.data.key
           }).then((downloadResponse) => {
              return resolve({
                link: downloadResponse.data.downloadUrl,
                duration: videoInfo.data.duration,
                durationLabel: videoInfo.data.durationLabel,
                fromCache: videoInfo.data.fromCache,
                id: videoInfo.data.id,
                key: videoInfo.data.key,
                thumbnail: videoInfo.data.thumbnail,
                thumbnail_formats: videoInfo.data.thumbnail_formats,
                title: videoInfo.data.title,
                titleSlug: videoInfo.data.titleSlug,
                videoUrl: videoInfo.data.url,
                quality,
                type
              });
           });
        }).catch((error) => reject(error));
      });
    }
}

module.exports = new SaveTube;

/*
new SaveTube().download('https://youtu.be/dzd5rKM3V98?si=dglV4m5i7YZW_iNI', 4, 'audio')
    .then((data) => console.log('Sucesso:', data))
    .catch((error) => console.error('Error:', error.message));
*/
