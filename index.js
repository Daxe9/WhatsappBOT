const { Client } = require('whatsapp-web.js')
const NSFWManager = require("./NSFWManager.js")
const AdminManager = require("./AdminManager.js")
const QRCode = require('qrcode-terminal')
const config = require('./config.json')
const client = new Client()

const NSFW = new NSFWManager(client)
const Admin = new AdminManager(client)
const modules = [Admin, NSFW]

client.on('qr', (qr) => QRCode.generate(qr, { small: true }))

client.on('ready', () =>
{
    console.log("Successfully logged in!")
})

client.on('message_create', message =>
{
    parseMessage(message)
})

client.initialize()

async function parseMessage(message)
{
    let info =
    {
        isInGroup: false,
        isCommand: false,
        isSelf: false,
        content: "",
        sender: "",
        group: "",
        command: {
            name: "",
            args: [],
            flags: []
        }
    }

    if (message.body.startsWith(`${config.prefix} `))
    {
        info.isCommand = true
        info.command.name = message.body.substring(config.prefix.length).split(" ")[1]
        info.command.args.push(message.body.substring(config.prefix.length + info.command.name.length + 2))
    }

    if (message.fromMe)
        info.isSelf = true

    info.sender = message.from
    info.content = message.body

    await message.getChat().then(chat =>
    {
        if (chat.isGroup)
        {
            info.isInGroup = true
            info.group = chat.name
        }
    })

    console.log(info)

    for (let i = 0; i < modules.length; i++)
    {
        for (let j = 0; j < modules[i].commands.length; j++)
        {
            if (info.command.name == modules[i].commands[j].name)
            {
                modules[i].commands[j](message, info.command)
                return
            }
        }
    }
}