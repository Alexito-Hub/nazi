import axios from 'axios'

class SaveTube {
    constructor() {
        this.qualities = {
            audio: { 1: '32', 2: '64', 3: '128', 4: '192' },
            video: { 1: '144', 2: '240', 3: '360', 4: '480', 5: '720', 6: '1080', 7: '1440', 8: '2160' }
        };
        this.headers = {
            'Accept': '*/*',
            'Content-Type': 'application/json',
            'Referer': 'https://ytshorts.savetube.me/',
            'Origin': 'https://ytshorts.savetube.me/',
            'User-Agent': 'Postify/1.0.0'
        }
    }

    download(url, cdn, body = {}) {
        return new Promise(async (resolve, reject) => {
            if (!['audio', 'video'].includes(type)) {
                return reject(new Error('❌ Tipo inválido. Escolha "audio" ou "video".'));
            }
            if (!this.qualities[type]?.[qualityIndex]) {
                throw new Error(`❌ Qualidade ${type} inválida. Escolha entre: ${Object.keys(this.qualities[type]).join(', ')}`);
            }

            const random = Math.floor(Math.random() * 11) + 51
            const url = `cdn${random}.savetube.su`

            const { data } = await axios.post(`https://${url}/info`, { url: link }, {
                headers: {
                    ...this.headers,
                    authority: `cdn${random}.savetube.su`
                }
            })

            const { data: download } = await axios.post(`https://${url}/download`, {
                downloadType: type,
                quality: this.qualities[type][qualityIndex],
                key: process.data.key
            }, {
                headers: {
                    ...this.headers,
                    authority: `cdn${random}.savetube.su`
                }
            })

            return resolve({
                link: download.data.downloadUrl,
                duration: data.data.duration,
                durationLabel: data.data.durationLabel,
                fromCache: data.data.fromCache,
                id: data.data.id,
                key: data.data.key,
                thumbnail: data.data.thumbnail,
                thumbnail_formats: data.data.thumbnail_formats,
                title: data.data.title,
                titleSlug: data.data.titleSlug,
                videoUrl: data.data.url,
                quality,
                type
            })
        })
    }
}

/*
new SaveTube().download('https://youtu.be/dzd5rKM3V98?si=dglV4m5i7YZW_iNI', 4, 'audio')
    .then((data) => console.log('Sucesso:', data))
    .catch((error) => console.error('Error:', error.message));
*/
