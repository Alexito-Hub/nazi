import "../config.js";
import baileys, {
	jidDecode,
	generateForwardMessageContent,
	makeWASocket,
	areJidsSameUser,
	jidNormalizedUser,
	downloadContentFromMessage,
	prepareWAMessageMedia,
	generateWAMessageFromContent,
} from "@al-e-dev/baileys"

const { proto } = baileys

import FileType from 'file-type'
import { parsePhoneNumber } from "libphonenumber-js/mobile"


import { byteToSize } from "./functions.js"

export function _prototype(args, options = { }) {
	const sock = Object.defineProperties(makeWASocket(args), {
		parseMention: {
			value (text) {
				return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + "@s.whatsapp.net");
			},
			enumerable: true
		},
		decodeJid: {
			value (jid) {
				if (!jid) return jid;
				if (/:\d+@/gi.test(jid)) {
					let decode = jidDecode(jid) || {}
					return decode.user && decode.server && decode.user + "@" + decode.server || jid
				} else return jid
			},
			enumerable: true
		},
		getMessageType: {
			value (m) {
				let Type = Object.keys(m);
				if (!["senderKeyDistributionMessage", "messageContextInfo"].includes(Type[0])) { return Type[0]; }
				else if (Type.length >= 3 && Type[1] != "messageContextInfo") { return Type[1]; }
				else Type[Type.length - 1] || Object.keys(m)[0];
			},
			enumerable: true
		},
		getMessageBody: {
			value (type, msg) {
				const body = {
					conversation: () => msg,
					viewOnceMessageV2: () => msg.message.imageMessage?.caption ? msg.message.imageMessage?.caption : msg.message.videoMessage?.caption,
					imageMessage: () => msg?.caption,
					videoMessage: () => msg?.caption,
					extendedTextMessage: () => msg?.text,
					viewOnceMessage: () => msg.message.videoMessage?.caption ? msg.message.videoMessage?.caption : msg.message.imageMessage?.caption,
					documentWithCaptionMessage: () => msg.message.documentMessage?.caption,
					buttonsMessage: () => msg.imageMessage?.caption,
					buttonsResponseMessage: () => msg?.selectedButtonId,
					listResponseMessage: () => msg.singleSelectReply?.selectedRowId,
					templateButtonReplyMessage: () => msg?.selectedId,
					groupInviteMessage: () => msg?.caption,
					pollCreationMessageV3: () => msg,
					interactiveResponseMessage: () => JSON.parse(msg.nativeFlowResponseMessage.paramsJson).id,
					text: () => msg.text
				}
				return body[type] ? body[type]() : ""
			} 
		},
        
        ////////////// [ MESSAGE ALL ] /////////////////////

        sendMessageAck: {
            async value (jid, { title, subtitle, body, footer, media, buttons = [], mentions}, options = {}) {
                if(!jid) throw new ReferenceError("jid is required")
                
                let buffer

                if (media && (media.type === "image" || media.type === "video" || media.type === "document")) {
					const mediaContent = media.buffer ? media.buffer : { url: media.url };
					buffer = await prepareWAMessageMedia({ [media.type]: mediaContent }, { upload: sock.waUploadToServer });
				}				

                var msg = generateWAMessageFromContent(jid, { 
                    viewOnceMessage: { 
                        message: {
                            messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: new proto.DeviceListMetadata() },
                            interactiveMessage: {
                                header: {
                                    title: title,
                                    subtitle: subtitle,
                                    hasMediaAttachment: !!media,
                                    imageMessage: buffer?.imageMessage || null,
                                    videoMessage: buffer?.videoMessage || null
                                },
                                headerType: media ? media?.type.replace('Message', '').toUpperCase() : 'NONE',
                                body: { text: body },
                                footer: { text: footer },
                                nativeFlowMessage: {
                                    buttons: buttons,
                                    messageParamsJson: JSON.stringify({
										from: "apiv2",
										templateId: "4194019344155670"
									})
                                },
								contextInfo: {
									mentionedJid: Array.isArray(mentions) ? mentions : []
								}
                            }
                        }
                    }
                }, {
                    userJid: sock.user.jid,
					quoted: options?.quoted,
                })
                
                await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
                return msg
            },
            enumerable: true
        },
        sendCarousel: {
            async value(jid, { title, subtitle, body, footer, media, carousel = [] }, options = {}) {
                if(!jid) throw new ReferenceError("jid is required")
                const cards = await Promise.all(carousel.map(
                    async ({ title, body, footer, subtitle, buttons = [], media }) => {
						let buffer

						if (media && (media.type === "image" || media.type === "video" || media.type === "document")) {
							const mediaContent = media.buffer ? media.buffer : { url: media.url };
							buffer = await prepareWAMessageMedia({ [media.type]: mediaContent }, { upload: sock.waUploadToServer });
						}	

                        return {
                            body: { text: body },
                            footer: { text: footer },
                            header: {
                                title: title,
								subtitle: subtitle,
                                hasMediaAttachment: !!media,
                                imageMessage: buffer?.imageMessage || null,
                                videoMessage: buffer?.videoMessage || null
                            },
							headerType: media ? media?.type.replace('Message', '').toUpperCase() : 'NONE',
                            nativeFlowMessage: {
                                buttons: buttons,
                                messageParamsJson: JSON.stringify({
									from: "apiv2",
									templateId: "4194019344155670"
								})
                            }
                        }
                    }
                ))

				let buff

				if (media && media.type === "image" ||media && media.type === "video" ||media && media.type === "document") {
					const mediaContent = media.buffer ? media.buffer : { url: media.url };
					buff = await prepareWAMessageMedia({ [media.type]: mediaContent }, { upload: sock.waUploadToServer });
				}	
                const msg = generateWAMessageFromContent(jid, {
                    botInvokeMessage: {
                        message: {
                            messageContextInfo: {
                                deviceListMetadata: new proto.DeviceListMetadata(),
                                deviceListMetadataVersion: 2
                            },
                            interactiveMessage: {
                                body: { text: body },
                                footer: { text: footer },
                                header: {
                                    title: title,
                                    subtitle: subtitle,
									hasMediaAttachment: !!media,
									imageMessage: buff?.imageMessage || null,
									videoMessage: buff?.videoMessage || null
                                },
								headerType: media ? media?.type.replace('Message', '').toUpperCase() : 'NONE',
                                carouselMessage: {
                                    cards,
									messageVersion: 1
                                }
                            }
                        }
                    }
                }, {
                    userJid: sock.user.id,
                    quoted: options?.quoted,
                    upload: sock.waUploadToServer,
					ephemeralExpiration: options?.ephemeralExpiration
                });
                await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
                return msg;
            }
        },

        ////////////// [ MESSAGE ALL ] /////////////////////

		forward: {
            async value(jid, message, forwardingScore = true, options = {}) {
                let m = generateForwardMessageContent(message, !!forwardingScore);
                let type = Object.keys(m)[0];
                if (forwardingScore && typeof forwardingScore == 'number' && forwardingScore > 1) {
                    m[type].contextInfo.forwardingScore += forwardingScore;
                }
        
                m = generateWAMessageFromContent(jid, m, { ...options, userJid: sock.user.id });
                await sock.relayMessage(jid, m.message, { messageId: m.key.id, additionalAttributes: { ...options } });
                return m;
            }
        },
        getName: {
			value(jid) {
				return new Promise(async(resolve, reject) => {
					if (!jid) return;
					let id = sock.decodeJid(jid);
					let format = parsePhoneNumber(`+${id.replace("@s.whatsapp.net", "")}`);
					let v;
					if (id.endsWith("@g.us")) {
						v = store.groupMetadata[id] || await sock.groupMetadata(id).catch(_ => ({ subject: id }));
						resolve(v.subject || v.id);
					} else {
						v = (id == "0@s.whatsapp.net") ? { id, name: "Whatsapp"} : areJidsSameUser(id, sock.user.id) ? { id, name: sock.user.name } : store.contacts[id] ? store.contacts[id] : { id, name: "NPC" };
						resolve(v.name || v.verifiedName || format.number);
					}
				});
			},
			enumerable: true
		},
		downloadMediaMessage: {
		    async value (type, media) {
		        const stream = await downloadContentFromMessage(type, media);
		        let buffer = Buffer.from([]);
		        for await (const chunk of stream) {
		            buffer = Buffer.concat([buffer, chunk]);
		        }
		        return buffer
		    },
		    enumerable: true
		},
		getAdmins: {
			async value (from) {
				try{
					if (!from && !from.endsWith("@g.us")) return;
					let admins = new Array();
					let { participants } = await(await sock.groupFetchAllParticipating)[from] || await store.groupMetadata[from];
					for (let i of participants) {
						if (/admin|superadmin/.test(i.admin)) admins.push(i.id);
					}
					return admins.map(i => i);
				} catch(e) {
					return [];
				}
			},
			enumerable: true
		},
		getMetadata: {
			async get () {
				let chats = await sock.groupFetchAllParticipating().catch(_ => null) || {};
				
				let chat = Object.keys(chats).map(i => i);
				
				for(let i in chats) store.groupMetadata[i] = {
					...(store.groupMetadata[i] || {}),
					...(chats[i] || {}),
					code: await sock.groupInviteCode(i).catch(_ => null) || "No es admin el bot"
				};

				Object.keys(store.groupMetadata).forEach((i) => {
					if (!chat.includes(i)) delete store.groupMetadata[i];
				});
			},
			enumerable: true
		},
		sendText: {
			async value (from, text = "", options = { }) {
				return await sock.sendMessage(from, {
					text: text,
					contextInfo: {
						remoteJid: options.remote ? options.remote : null,
						mentionedJid: options.mentions ? options.mentions : sock.parseMention(text),
						externalAdReply: options.ads ? {
							renderLargerThumbnail: options.render ? options.render : null,
							showAdAttribution: options.adAttrib ? options.adAttrib : null,
							title: options.title ? options.title : "",
							body: options.body ? options.body : "",
							mediaType: 1,
							thumbnailUrl: options.image ? options.image : "",
							sourceUrl: options.url ? options.url : null
						} : null
					}
				}, {
					quoted: options.quoted ? options.quoted : null
				});
			},
			enumerable: true
		},
		sendMedia: {
			async value (from, path, options = { }) {
				let type;
				let buffer;
				let Size;
				if (Buffer.isBuffer(path)) { buffer = path } else await fetch(path).then(async(response) => {
					let data = await response.arrayBuffer();
					buffer = Buffer.from(data);
					Size = data.byteLength;
				})
				let { ext, mime } = await FileType.fromBuffer(buffer);
				let size = byteToSize(Size);
				if (options.document) type = "document";
				else if(options.sticker || mime.split("/")[1] == "webp") type = "sticker";
				else if(/image/.test(mime)) type = "image";
				else if(/video/.test(mime)) type = "video";
				else if(/audio/.test(mime)) type = "audio";
				else if (size.split(" MB") >= 99.00) type = "document";
				else type = "document";

				return await sock.sendMessage(from, {
					[type]: buffer,
					caption: options.caption ? options.caption : null,
					ptt: (options.ptt && type == "audio") ? options.ptt : null,
					gifPlayback: (type == "video" && options.gif) ? options.gif : null,
					mimetype: options.mime ? options.mime : mime,
				}, {
					quoted: options.quoted ? options.quoted : null
				});
			},
			enumerable: true
		}
	})
	
	if (sock.user?.id) sock.user.jid = jidNormalizedUser(sock.user.id);

	return sock;
};