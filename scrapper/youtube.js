import got from "got";
import crypto from "crypto";

export default class YouTube {
    constructor() {
        this.baseUrl = "https://www.youtube.com";
        this.suffix = "f24c8c73d48b7686ed11a3bf97983f6f7eb6395f19268184aae742e93683c00c";
        this.headers = {
            accept: "*/*",
            "accept-encoding": "gzip, deflate, br",
            "accept-language": "en-US,en;q=0.9",
            "sec-ch-ua": '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            "sec-ch-ua-mobile": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
        };
    }

    async generateHash(url) {
        const hash = crypto.createHash('sha256');
        hash.update(url + Date.now() + this.suffix);
        return hash.digest('hex');
    }

    time2Number(time) {
        return (time.match(/(\d+)\s*hours?|(\d+)\s*minutes?|(\d+)\s*seconds?/g) || [])
            .reduce((total, part) => {
                const [value, unit] = part.split(' ');
                const intValue = parseInt(value);
                if (unit.startsWith('hour')) return total + intValue * 3600;
                if (unit.startsWith('minute')) return total + intValue * 60;
                if (unit.startsWith('second')) return total + intValue;
                return total;
            }, 0);
    }

    parseFileSize(size) {
        const sized = parseFloat(size);
        return (isNaN(sized) ? 0 : sized) * (/GB/i.test(size) ? 1000000 : /MB/i.test(size) ? 1000 : /KB/i.test(size) ? 1 : /bytes?/i.test(size) ? 0.001 : /B/i.test(size) ? 0.1 : 0);
    }

    async search(query) {
        const html = await got(this.baseUrl + "/results", {
            headers: this.headers,
            searchParams: { search_query: query },
        }).text();

        const script = /var ytInitialData = {(.*?)};/.exec(html)?.[1];
        if (!script) throw new Error(`Can't find script data (ytInitialData)!`);
        const json = JSON.parse('{' + script + '}');
        const contents = json.contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents[0].itemSectionRenderer.contents;

        return contents.map(content => {
            const tag = Object.keys(content)[0];
            if (tag === 'videoRenderer') {
                const data = content[tag];
                return {
                    videoId: data.videoId,
                    url: `https://www.youtube.com/watch?v=${data.videoId}`,
                    title: data.title.runs.pop().text,
                    thumbnail: data.thumbnail.thumbnails.pop().url,
                    description: data.detailedMetadataSnippets?.pop()?.snippetText.runs.map(({ text }) => text).join('') || '',
                    movingThumbnail: data.richThumbnail?.movingThumbnailRenderer.movingThumbnailDetails.thumbnails.pop()?.url || data.thumbnail.thumbnails.pop()?.url,
                    channelName: data.longBylineText.runs[0].text,
                    channelAvatar: data.channelThumbnailSupportedRenderers.channelThumbnailWithLinkRenderer.thumbnail.thumbnails.pop().url,
                    isChannelVerified: data.ownerBadges?.some(badge => badge.metadataBadgeRenderer.style === 'BADGE_STYLE_TYPE_VERIFIED') || false,
                    publishedTime: data.publishedTimeText?.simpleText || 'unknown',
                    viewH: data.viewCountText?.simpleText || '0 views',
                    durationH: data.lengthText?.accessibility.accessibilityData.label || '00:00',
                    duration: this.time2Number(data.lengthText?.accessibility.accessibilityData.label || '00:60')
                };
            }
            return null;
        }).filter(Boolean);
    }

    async download(url, server = 'en') {
        const form = { k_query: url, k_page: 'home', hl: server, q_auto: 0 };
        const data = await got.post('https://www.y2mate.com/mates/analyzeV2/ajax', {
            headers: {
                ...this.headers,
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                cookie: '_ga=GA1.1.1058493269.1720585210; _ga_PSRPB96YVC=GS1.1.1720585209.1.1.1720585486.0.0.0',
                origin: 'https://www.y2mate.com'
            },
            form
        }).json();
        const json = data;
        const video = {}, audio = {}, other = {};
        for (const key in json.links) {
            for (const tag in json.links[key]) {
                const item = json.links[key][tag];
                const type = item.f;
                const quality = item.q;
                const fileSizeH = item.size;
                const fileSize = this.parseFileSize(fileSizeH);
                (type === 'mp4' ? video : type === 'mp3' ? audio : other)[quality.toLowerCase()] = {
                    quality, type, fileSizeH, fileSize,
                    download: await this.convert(json.vid, item.k)
                };
            }
        }
        return {
            id: json.vid,
            thumbnail: `https://i.ytimg.com/vi/${json.vid}/0.jpg`,
            title: json.title,
            duration: json.t,
            video, audio, other
        }
    }

    async convert(vid, k) {
        const form = { vid, k };
        const { dlink } = await got.post('https://www.y2mate.com/mates/convertV2/index', {
            headers: {
                ...this.headers,
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                cookie: '_ga=GA1.1.1058493269.1720585210; _ga_PSRPB96YVC=GS1.1.1720585209.1.1.1720585486.0.0.0',
                origin: 'https://www.y2mate.com'
            },
            form
        }).json()

        return dlink
    }
}

const youtube = new YouTube();
youtube.download('https://www.youtube.com/watch?v=ZueYnZFggoQ')
    .then(_ => console.log(JSON.stringify(_, null, 2)))
    .catch(console.error);