import axios from 'axios';
import * as cheerio from 'cheerio';

export default class Pinterest {
    constructor() {
        this.url = 'https://es.pinterest.com'
        this.cookies = "_auth=1; _b=\"AX40eokqpF1Ab5gDD4BjzSsGGBt5jEWnd0bAS4GMMxE174Kg/vSRaTS6PxrQeFObEsA=\"; _pinterest_sess=TWc9PSZOWlM4SVd1SGh6eXh5Mmxnb2UvVVFzUHdiaG9tTFg1NDJNeGJ5RXdTTlFGY3ZCNEJTclJ6YmgzeWs3QmhUV0hMK0VDQVBjYWtpVjEyRXFPemRmOUhUMUN5aWNNT09CUkdSTjVCSVpJd3Y2ZjVzcVEvUHFZV3BYN3ZpZzhxUElEWXlIUDY4OFRYU1VKcWtnREJzV1Y5OVF0SnAzM2ZVNjV5RDBjQnRNMVhKbjdTZWFTRDVBeFVpb09UVXB3RFlvWEFCV21JTWRWNnpScVZCUXlxNFl0M1hObjhoYzJ6blB2cHNjbUt1ZS9YNFoyK2N3cXE4Rm1CbW9HT2hXbllrNVFLWEc2RXdEK0ptODloMlZVOHBIVUlKUE1vTXE5QUNXOHpSNnNaeGlOTDVRTEVuN3BaZCt0enVSNFMyRkZsWmFZemdsY2E1U2Y1TnU3eEhFSEJGenBrZm82VjI3NHgvOWRqRkJYWGUvZmJSa1NZVUdLODFUcUR5bEtjTlVWUHhlUGJOYyt2U215MWM2SHc1V1U1L2hjUHFrZzRQZEhycEFzNUlwdWw0WjFFVktsTnRBdzM3SVQwMlcxaHg5aUk2eWtLWDNtaXBscm0zRHBwbkVhRFRqRERlZUNDaGxIVEZ0S1ZlMUEwdE94ajEwMjZUcXlGMXNIbnpTVHRqSUs2V3NxbkFFNlpNRmNGNDg1YjNRbjYxeWtUWUF0cXJpV21JUGVzR1BpMHVTRFRVM1BQSmswaysxSUlqdk8wOTR2d3dTQ3VpdCtkTTRqUzhqN3MrSlFiWHV6cStsYnNGUnNpSE4rQTJyazRuOWRpRk4yeUYyRC8ybVNhUnYxYVpLc1NNKzVObVlRWXhXQ3pTNVBSQmlGRHEyc1NWU3I3ZUM5ODhwOTJSRVlGRXZUd1BucVhOdExMczU1Zm9UZFpmWFVTMXcwR3Mvb1R3YWI2T0w4VTBuTTFGbFlWM0YyWlZBMGlEY3UrYktJb3F5S290YUlYSlFpM0ZxNjcxZ2tkYTVibkxReUF1UzM5WE1ad210SG5nRGNOOEVxMzRpeUNTNDRWS2J2VVJlN0ZPRittY3RWM0NCd0RoOUFPcEZ3bWQvaGNUWmxpSVk4S0ZMeUlSbXBEbDZsZ1dmUmxPbW1kMkZQZGllQ2JHTjV6SU5WZ0JNdVFOcGNSeDQxalBIcThLV1VNU3RTZnB2SzBIaTdCV1ZsMXl2QzJ6QlFNUXB6Mm14QzhPMm5BVWZFTXdlakdVZmZCVC9mTlo5bFZEeXJtV3JqOUE2NDFiNUpBUFNjTFZzQnlPT25ZUE13RWFxc1lCRUtGMEl4RUxkZ3owUDhjUEdrWFNSNDloOHRnN3lqa3dvRVdJWk1Ob0xqRFlkZHEzVDdHUE92VmcyaDlaa0hQV1BKUnFPUHMxdzRxUVBrWjQ1R0dFY2poNGE0eHR1SXJOWTJNNVN2RXhtaU8zRlp3aHlvSHZQWndSREdCVHNkcWVRYVorcEhKV21kRHVNQlFlZWMralZza1dnOThyaVAzS2pMSHBHa2ViYlYzVE5Qd0EyN2Z5Qy9Fa0NmSnNlYkNBREF3dGZoMk0zTTUzVkp3a2J3cHB4SWxqOGgrZUxqWXRsVldnT0FqZHNsMlQxR1BTbTl4Q0c0dlk3Z1B6RzJySEQ3bXcwRHY4VFcrRm9nVVVUREtOR1BveCsreUtWaUJLaTVTMGhNTURRUlNLM2hmU1dDcHlVTVJ5SCtobUJXRnlDUjQrL2JjYTNrd2FTUVlMZU1PTGhKbGZYK2l1VnZGY051NjBkTVMmK3oxZG5SeFhUWTFZWGtXZ2trTGtyYml3aGgwPQ==; _ir=0"
        this.cookie = "_auth=0; _pinterest_sess=TWc9PSZ4Y010WHZ5ZUl4V2FDTGphbWtHbDJuQkNaU0pCWWh6ZXFTZWVKaWxHdzZJQVFSWGc2Tk9tVGprK3NpY2VzWGprbHFBS0VsaDJBaVR0Ukd1b0c4NTBJdnJvZmtSNFVvUUdoaHpsdWtjM3hhbz0mUzZsY3NCUkVtYjZFeFJqOHRKUWVqZWhiMHBvPQ==; _ir=0"
    }

    async download(url) {
        return new Promise(async (resolve, reject) => {
            
            const response = await axios(url, {
                method: "GET",
                headers: {
                    "cookie": this.cookie
                }
            })
    
            const $ = cheerio.load(response.data)
    
            const title = $('div[data-test-id="CloseupDetails"] > div > h1').text().trim() ? $('div[data-test-id="CloseupDetails"] > div > h1').text().trim() : $('div[data-test-id="pinTitle"] > hi').text().trim() ? $('div[data-test-id="pinTitle"] > h1').text().trim() : 'a pinterest scrapper'
            const description = $('div[data-test-id="truncated-description"] > div > div').text().trim() || 'a pinterest scrapper'
            const download = $('div[data-test-id="pin-closeup-image"] > div > div').find('img').attr('src') ? $('div[data-test-id="pin-closeup-image"] > div > div').find('img').attr('src').replace('236x', '736x') : null
    
            const categories = [];
            $('div[data-test-id="vase-tag"] > span > a').each((i, elem) => { categories.push($(elem).text().trim()) });
    
            const hashtags = [];
            $('div.tBJ.dyH.iFc.sAJ.X8m.zDA.IZT.swG a').each((i, elem) => {
                const text = $(elem).text().trim();
                if (text.startsWith('#')) {
                    hashtags.push(text);
                }
            });
    
            const link = $('div[data-test-id="creator-avatar"] a[data-test-id="creator-avatar-link"]').attr('href') ? $('div[data-test-id="creator-avatar"] a[data-test-id="creator-avatar-link"]').attr('href') : $('div[data-test-id="official-user-attribution"] a').attr('href')
            const image = $('div[data-test-id="gestalt-avatar-svg"] > div > div > img').attr('src') 
    
            const name = $('div[data-test-id="creator-profile-name"] > div > div').text().trim() ? $('div[data-test-id="creator-profile-name"] > div > div').text().trim() : $('div[data-test-id="username"] div div').text().trim() ? $('div[data-test-id="username"] > div > div').text().trim() : $('div[data-test-id="creator-profile-name"] > div').text().trim() 
            const followers = $('div[data-test-id="follower-count"] div.swG').text().trim() ? $('div[data-test-id="follower-count"] div.swG').text().trim() : $('div[data-test-id="follower-count"] div a').text().trim() ? $('div[data-test-id="follower-count"] div a').text().trim() : $('div[data-test-id="user-follower-count"] div div').text().trim()
    
            resolve({
                title,
                description,
                categories,
                hashtags,
                author: {
                    name,
                    followers,
                    link: link ? this.url + link : null,
                    image: image ? image : null
                },
                download
            })
        })

    }

    async search(search) {
        const response = await axios(this.url + `/search/pins/?q=${search}`, {
            method: "GET",
            headers: { 
                "cookie": this.cookies
            }
        })

        const $ = cheerio.load(response.data)

        const result = [];
        
        const pins = $('div[data-test-id="pin"]');
        for (let i = 0; i < pins.length; i++) {
            const url = $(pins[i]).attr('data-test-pin-id');
            if (url) {
                const details = await this.download(this.url + '/pin/' + url);
                result.push({
                    url: this.url + '/pin/' + url,
                    ...details
                });
            }
        }

        return result;
    }
}
// const a = new Pinterest()

// a.search("alya").then((_) => console.log(_))

// a.download("https://es.pinterest.com/pin/291045194689051504/").then(_ => console.log(_))