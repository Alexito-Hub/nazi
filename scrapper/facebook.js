import axios from 'axios'
import * as cheerio from 'cheerio'

export default class Facebook {
    constructor() {
        this.baseUrl = 'https://getmyfb.com'
    }

    async download(url) {
        return new Promise(async (resolve, reject) => {
            const { data: html } = await axios({
                method: "POST",
                url: this.baseUrl + "/process",
                headers: {
                    'cookies': 'PHPSESSID=82o6gt2h2880kpiimkgj4ogjer __cflb=0H28vwyfhACcZteBqmh4duvZ364xFvNpxpp4c8jQM31 _token=tEhG4AaSxgFva4F4vz16'
                },
                data: {
                    id: url,
                    locales: "en"
                }
            })

            const $ = cheerio.load(html)

            const title = $('div[class="results-item-text"]').eq(0).text().trim()
            const cover = $('div[class="results-item-image-wrapper"] > img[class="results-item-image"]').attr('src')
            const qualities = []

            $('li[class="results-list-item"]').each((i, e) => {
                const quality = $(e).text().trim().split('\n')[0].trim()
                const url = $(e).find('a').attr('href')

                qualities.push({
                    quality,
                    url
                })
            })

            resolve({
                title,
                cover,
                qualities
            })
        })
    }
}