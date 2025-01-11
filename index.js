import dotenv from 'dotenv'
dotenv.config()

import baileys, { 
	DisconnectReason,
	makeInMemoryStore,
	useMultiFileAuthState,
	fetchLatestBaileysVersion,
	makeCacheableSignalKeyStore,
	Browsers,
	getContentType,
	extractMessageContent,
	jidNormalizedUser,
    delay,
} from "@al-e-dev/baileys"

import { Boom } from "@hapi/boom"
import { exec } from "child_process"
import { format } from 'util'

import pino from "pino"
import chalk from "chalk"
import NodeCache from '@cacheable/node-cache'
import readline from 'readline'

import { _prototype } from "./lib/_prototype.js"
import { unwatchFile, watchFile } from 'fs'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const { proto } = baileys
const { state, saveCreds } = await useMultiFileAuthState("./auth/session")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = text => new Promise(resolve => rl.question(text, resolve))

const start = async() => {
    const { version } = await fetchLatestBaileysVersion()

	let client = _prototype({
        version,
		logger: pino({ level: "silent" }),
		printQRInTerminal: false,
		mobile: false,
		browser: Browsers.ubuntu('Chrome'),
		auth: {
		    creds: state.creds,
		    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
		},
		msgRetryCounterCache: new NodeCache()
	})
	
	store?.bind(client.ev)
	
	client.ev.on("creds.update", saveCreds)

	if(!client.authState.creds.registered) {
		const phoneNumber = await question(chalk.bold("Ingresa tu número de WhatsApp activo: "))
		const code = await client.requestPairingCode(phoneNumber)
		console.log(chalk.bold(`Emparejamiento con este código: ${code}`))
	}

	client.ev.on("connection.update", async({ connection, lastDisconnect}) => {
		if (connection === 'close') {
			const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
			if (reason === DisconnectReason.badSession) {
				console.log(chalk.red.bold("Sesión incorrecta, por favor elimina la carpeta ./auth y empieza de nuevo."))
				fs.rmSync('./auth', { recursive: true, force: true });
				start()
			} else if (reason === DisconnectReason.connectionClosed) {
				console.log(chalk.yellow.bold("Conexión cerrada, reconectando..."))
				start()
			} else if (reason === DisconnectReason.connectionLost) {
				console.log(chalk.blue.bold("Conexión perdida con el servidor, reconectando..."))
				start()
			} else if (reason === DisconnectReason.connectionReplaced) {
				console.log(chalk.magenta.bold("Conexión reemplazada, se ha abierto una nueva sesión. Por favor, reinicia el bot."))
				process.exit()
			} else if (reason === DisconnectReason.loggedOut) {
				console.log(chalk.green.bold("Se ha cerrado la sesión en el dispositivo, por favor elimina la carpeta ./auth y conéctate de nuevo."))
				fs.rmSync('./auth', { recursive: true, force: true })
				start()
			} else if (reason === DisconnectReason.restartRequired) {
				console.log(chalk.cyan.bold("Reinicio requerido, reiniciando..."))
				start()
			} else if (reason === DisconnectReason.timedOut) {
				console.log(chalk.orange.bold("Tiempo de espera agotado, reconectando..."))
				start()
			} else if (reason === DisconnectReason.forbidden) {
				console.log(chalk.redBright.bold("No tienes permisos para realizar esta acción."))
				process.exit()
			} else if (reason === DisconnectReason.multideviceMismatch) {
				console.log(chalk.purple.bold("Sincroniza tus dispositivos."))
				start()
			} else if (reason === DisconnectReason.unavailableService) {
				console.log(chalk.red.bold("El servicio no está disponible actualmente. Inténtalo más tarde."))
				process.exit()
			} else {
				console.log(chalk.white.bold(`Razón de desconexión desconocida: ${reason} | ${connection}`))
				process.exit()
			}
		} else if (connection === 'open') {
			console.log('connection open')
		}
	})
	
	

	client.ev.on("messages.upsert", async m => {
		if(!m) return

		const v = m.messages[m.messages.length - 1]
		
		const from = v.key.remoteJid.startsWith('52') && v.key.remoteJid.charAt(2) !== '1' ? '52' + '1' + v.key.remoteJid .slice(2) : v.key.remoteJid
		const participant = from.endsWith("@g.us") ? (v.key.participant.startsWith('52') && v.key.participant.charAt(2) !== '1' ? '52' + '1' + v.key.participant .slice(2) : v.key.participant) : false
		
		const botNumber = client.user.id.split(':')[0] 
		const type = getContentType(v.message)
		const msg = extractMessageContent(v.message?.[type])
		const body = client.getMessageBody(type, msg) || ''
		const quoted = (msg?.contextInfo && Object.keys(msg.contextInfo).some(i => i == "quotedMessage")) ? proto.WebMessageInfo.fromObject({ key: { remoteJid: from || v.key.remoteJid, fromMe: (msg.contextInfo.participant == client.user.jid), id: msg.contextInfo.stanzaId, participant: msg.contextInfo.participant }, message: msg.contextInfo.quotedMessage }) : false
		const sender = jidNormalizedUser(v.key.participant || v.key.remoteJid)
		const cmd = typeof body === 'string' && prefix.some(i => body.toLowerCase().startsWith(i.toLowerCase()))
        const command = cmd ? body.slice(prefix.find(prefix => body.toLowerCase().startsWith(prefix.toLowerCase())).length).trim().split(' ')[0].toLowerCase() : typeof body === 'string' ? body.trim().split(' ')[0].toLowerCase() : ''
        const args = body.slice(cmd ? prefix.find(prefix => body.toLowerCase().startsWith(prefix.toLowerCase())).length + command.length : command.length).trim().split(/ +/)

		const metadata = from.endsWith("@g.us") ? await client.groupMetadata(from) : false
		const admins = metadata ? metadata.participants.filter(i => i.admin == "admin" || i.admin == "superadmin").map(i => i.id) : false
		const isAdmin = metadata ? admins.includes(sender) : false
		const isBotAdmin = metadata ? admins.includes(client.user.jid) : false

		const expiration = msg?.extendedTextMessage?.contextInfo?.expiration ?? msg?.contextInfo?.expiration ?? null
		
		const Number = from.endsWith("@g.us") ? v.key.participant : from
		const isOwner = v.key.fromMe || (sender.replace("@s.whatsapp.net", "") === owner.number) || mods.some(i => i === sender.replace("@s.whatsapp.net", ""))

		let ulink = { 
			key: { 
				participant: "13135550002@s.whatsapp.net", 
				...(from ? { remoteJid: sender } : {}),
			},
			message: { 
				extendedTextMessage: { 
					text: bot.name,
				}
			}
		}
			
		let vCard = {
			key: { 
				participant: "13135550002@s.whatsapp.net", 
				...(from ? { remoteJid: sender } : {}),
			},
			message: {
				contactMessage: {
					displayName: bot.name, 
					vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Meta AI;;;\nFN:Meta AI\nitem1.TEL;waid=13135550002:13135550002\nitem1.X-ABLabel:Celular\nEND:VCARD`, 
					contextInfo: {
						forwardingScore: 1,  
						isForwarded: true  
					}
				}
			}
		}
		/** TODO */
		switch (command) {
			case "tag": {
				if(!isOwner) return
				if (!quoted) return
				await client.sendMessage(from, { forward: quoted, contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: from } })
				break
			}
			case "broadcast": {
				if(!isOwner) return
				const groups = Object.entries(await client.groupFetchAllParticipating()).map(x => x[1])
					.filter(x => !x.announce)
					.filter(x => !x.isCommunityAnnounce)
					.map(x => x.id)
				
				let count = 0
				for (let id of groups) {
					if (args.join(' ')) {
					    await client.sendMessage(id, {
                            text: args.join(' '),
                            contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: id }
                        })
                    }
                    if (quoted) {
                        await client.sendMessage(id, {
                            forward: quoted,
                            contextInfo: { mentionedJid: metadata.participants.map((p) => p.id), remoteJid: id }
                        })
                    }
					count++
				}
				client.sendMessage(from, { text: `enviado a ${count} grupos`})
				break
			}

			case "kick":
			case "add": {
				if (!isBotAdmin) return client.sendMessage(from, { text: "*No se puede usar esta función si no soy administrador.*" })
				if (!isAdmin) return client.sendMessage(from, { text: "*Esta función es solo para los administradores.*" })

				if (command === "add") {
					if (!args.join(" ")) return client.sendMessage(from, { text: "*Escriba el número a agregar.*" })

					let user = mentionedJid[0] ? mentionedJid : quoted ? [quoted.sender] : args.join(" ").replace(/[^0-9]/g, '') + '@s.whatsapp.net'
					const adding = await client.groupParticipantsUpdate(from, [user], "add")

					if (adding[0].status === "403") {
						let link = 'https://chat.whatsapp.com/' + (await client.groupInviteCode(from))
						await client.sendMessage(user, { 
							text: `*Hola! Fuiste invitado para unirte a este grupo.*`, 
							contextInfo: { 
								externalAdReply: { 
									title: metadata.subject, 
									mediaType: 1, 
									thumbnailUrl: "https://telegra.ph/file/5fa373768ae095c367026.jpg", 
									mediaUrl: link, 
									sourceUrl: link 
								} 
							} 
						})
						await client.sendMessage(from, { text: "*Invitación enviada.*" })
					} else if (adding[0].status === "408") {
						await client.sendMessage(from, { text: "*No se pudo agregar porque abandonó el grupo recientemente. Inténtalo de nuevo más tarde.*" })
					} else if (adding[0].status === "401") {
						await client.sendMessage(from, { text: "*El usuario me ha bloqueado, no lo puedo agregar.*" })
					} else if (adding[0].status === "200") {
						await client.sendMessage(from, { text: "*El usuario fue agregado con éxito.*" })
					} else if (adding[0].status === "409") {
						await client.sendMessage(from, { text: "*El usuario ya se encuentra en el grupo.*" })
					}
				} else if (command === "kick") {
					let user = quoted ? quoted.sender : mentionedJid ? mentionedJid[0] : args.join(" ").replace(/[^0-9]/g, '') + "@s.whatsapp.net"
					if (!user) return client.sendMessage(from, { text: "*Marque un mensaje o use @ para elegir a quien eliminar.*" })
					if (client.user.jid === user) return client.sendMessage(from, { text: "*No puedo autoeliminarme.*" })
					if (admins.includes(user) && !isOwner) return client.sendMessage(from, { text: "*Mis permisos no me permiten eliminar a otro administrador.*" })
					if (user === sender) return client.sendMessage(from, { text: "*No puedes autoeliminarte.*" })
					if (mods.includes(user.split("@")[0])) return client.sendMessage(from, { text: "*Lo siento, este usuario es un moderador y no puede ser eliminado por el bot.*" })

					await client.groupParticipantsUpdate(from, [user], "remove")
					await client.sendMessage(from, { text: `*El usuario @${user.split("@")[0]} ya no forma parte del grupo.*`, mentions: [user] })
				}
				break
			}

			case "promote":
			case "demote": {
				if (!isBotAdmin) return client.sendMessage(from, { text: "*No se puede usar esta función si no soy administrador.*" });
				if (!isAdmin) return client.sendMessage(from, { text: "*Esta función es solo para los administradores.*" })

				let user = quoted ? quoted.sender : (mentionedJid.length != 0) ? mentionedJid[0] : body.replace(/[0-9]/i, "") + "@s.whatsapp.net";
				if (!user) return client.sendMessage(from, { text: "*Marque un mensaje o use @ para elegir a quien darle o quitar administración.*" });

				if (command === "promote") {
					if (admins.includes(user)) return client.sendMessage(from, { text: "*Este usuario ya posee privilegios de administrador.*" });
					await client.groupParticipantsUpdate(from, [user], "promote");
					await client.sendMessage(from, { 
						text: `*El usuario @${user.split("@")[0]} ha recibido el cargo de administrador por un _super usuario_.*`, 
						mentions: [...await client.getAdmins(from), user].map(i => i) 
					});
				} else if (command === "demote") {
					if (!admins.includes(user)) return client.sendMessage(from, { text: "*Este usuario no posee privilegios de administrador.*" });
					await client.groupParticipantsUpdate(from, [user], "demote");
					await client.sendMessage(from, { 
						text: `*El usuario @${user.split("@")[0]} se eliminó del cargo de administrador por un _super usuario_.*`, 
						mentions: [...await client.getAdmins(from), user].map(i => i) 
					});
				}
				break
			}

            case "join":
			case "unirse": {
				if (!isOwner) return client.sendMessage(from, { text: "*Lo siento, esto es una función exclusiva para moderadores y el dev.*" })
				if (!args.join(" ")) return client.sendMessage(from, { text: "*Ingrese un link de invitación para poder unirme al grupo.*" })

				let code = args.join(" ").split("chat.whatsapp.com/")[1]
				let data = await client.groupGetInviteInfo(code)

				if (Object.keys(store.groupMetadata).includes(data.id)) {
					await client.sendMessage(from, { text: "*Ya me encuentro en ese grupo*" })
					if (from != data.id) {
						return await client.sendMessage(data.id, { text: `*Aquí estoy, jefe. ¿En qué puedo ayudarle?* @${Number}`, mentions: [Number] })
					} else return
				}

				let joined = await client.groupAcceptInvite(code)
				if (joined) {
					await client.sendMessage(from, { text: `*Me uní correctamente a ${data.subject}*` })
					await client.sendMessage(data.id, { text: `*Hola a todos, soy ${bot.name}. Fui invitado por @${sender} para administrar este grupo. Espero llevarnos bien.*`, mentions: [sender] })
				} else {
					await client.sendMessage(from, { text: "*Recuerde que puedo estar en la lista de espera o si no tiene activada esa opción, intente agregarme manualmente.*" })
				}
				break
			}
            case "leave":
			case "salir":{
				if (!isOwner) return client.sendMessage(from, { text: "*Lo siento esto es una funcion exclusiva para moderadores.*"});
				await client.sendMessage(from, { text: "*Perfecto saliendo de " + metadata.subject + ", agurade...*"})
				await delay(5000)
				await client.groupLeave(from).then(async() => {
                    await client.sendMessage(sender, { text: "*Ya sali del grupo " + metadata.subject + "*"})
				}).catch(async() => {
					await client.sendMessage(from, { text: "*Lo siento hay algo que me impide salir. Intentelo manualmente.*"})
				})
                break
			}
			default: {
			    if (body.startsWith('$')) {
					if(!isOwner) return
					exec(args.join(' '), (error, stdout, stderr) => {
						if (error) return client.sendMessage(from, { text: `${error.message}`}, { quoted: ulink })
						if (stderr) return client.sendMessage(from, { text: `${stderr}`}, { quoted: ulink })
						client.sendMessage(from, { text: `${stdout}`}, { quoted: ulink })
					})
				}
				if (body.startsWith('_')) {
					if(!isOwner) return
					let evan
					let text = /await|return/gi.test(body) ? `(async () => { ${body.slice(1)} })()` : `${body.slice(1)}`
					try {
						evan = await eval(text)
					} catch (e) {
						evan = e
					} finally {
						client.sendMessage(from, { text: format(evan)}, { quoted: ulink })
					}
				}
			}
		}
	})
	client.ev.on("contacts.update", async contacts => {
		for (const contact of contacts) {
			const id = jidNormalizedUser(contact.id)
			if (store.contacts) store.contacts[id] = { id, name: contact.verifiedName || contact.notify }
		}
	})
	
	return client
}

start().catch(_ => console.log(_))

watchFile(resolve(fileURLToPath(import.meta.url)), () => {
    unwatchFile(resolve(fileURLToPath(import.meta.url)))
    console.log(`Update ${fileURLToPath(import.meta.url)}`)
    
    import(`${fileURLToPath(import.meta.url)}?update=${Date.now()}`)
      .then((module) => {
        console.log('Module reloaded', module)
      })
      .catch(err => {
        console.error('Error reloading module:', err)
      })
})