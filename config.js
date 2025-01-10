import { makeInMemoryStore } from "@al-e-dev/baileys"
import pino from "pino"

global.store = makeInMemoryStore({
    logger: pino().child({
        level: 'silent',
        stream: 'store'
    })
})

global.prefix = ['!', '?', '/', '.', '#'];

global.bot = {
	"name": "Nazi - Bot",
    "version": "1.0.0",
	"image": "https://telegra.ph/file/1343cf8e4f142b03099c9.jpg"
};
global.owner = {
	"number": "573234097278",
	"name": "Pineda"
}
global.mods = ['51968374620']

global.owner = {
	"number": "573234097278",
	"name": "Pineda"
}